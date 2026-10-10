// @ts-check
'use strict';

/**
 * Contact form core: validation, spam checks, rate limiting, and delivery through Resend.
 *
 * Everything here is runtime neutral. The Vercel function (api/contact.js) and the local
 * Express server (server.js) both call `handleContact` and `sendResult`.
 *
 * Delivery rule: the client is told "ok" only after Resend answers 2xx with a message id,
 * which means the provider accepted the message for sending. That is acceptance, not a
 * guarantee of inbox placement.
 */

const crypto = require('node:crypto');

const LIMITS = Object.freeze({
  name: 100,
  email: 254,
  messageMin: 10,
  message: 4000,
});

const DEFAULTS = Object.freeze({
  siteOrigin: 'https://neuroforge-portfolio.vercel.app',
  to: 'ibrahimowolabiayomide@gmail.com',
  // Works only for the Resend account owner until a domain is verified. See README.
  from: 'Neuroforge Portfolio <onboarding@resend.dev>',
  providerTimeoutMs: 8000,
  minFillMs: 1500,
});

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/* Pragmatic address check: a single at sign, no spaces or angle brackets, a dot in the domain. */
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
const SUBMISSION_ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

/** @param {unknown} value */
function singleLine(value) {
  return String(value == null ? '' : value)
    // control characters and Unicode line separators would allow header injection
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** @param {unknown} value */
function multiLine(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .trim();
}

/** @param {string} s */
function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * @typedef {{ name: string, email: string, message: string }} ContactValues
 * @typedef {{ ok: true, values: ContactValues } | { ok: false, errors: Record<string, string> }} Validation
 */

/**
 * Server-side validation. The client runs the same rules for fast feedback, but this is the
 * authority.
 * @param {Record<string, unknown>} body
 * @returns {Validation}
 */
function validate(body) {
  // Only genuine strings are accepted. Arrays and objects must not be coerced into text.
  const name = typeof body.name === 'string' ? singleLine(body.name) : '';
  const email = typeof body.email === 'string' ? singleLine(body.email) : '';
  const message = typeof body.message === 'string' ? multiLine(body.message) : '';
  /** @type {Record<string, string>} */
  const errors = {};

  if (!name) errors.name = 'Enter your name.';
  else if (name.length > LIMITS.name) errors.name = `Keep your name under ${LIMITS.name} characters.`;

  if (!email) errors.email = 'Enter your email address.';
  else if (email.length > LIMITS.email || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address, for example name@example.com.';

  if (!message) errors.message = 'Write a message.';
  else if (message.length < LIMITS.messageMin) errors.message = `Write at least ${LIMITS.messageMin} characters so I have something to reply to.`;
  else if (message.length > LIMITS.message) errors.message = `Keep the message under ${LIMITS.message} characters.`;

  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, values: { name, email, message } };
}

/**
 * @param {ContactValues} values
 * @param {{ requestId: string, now: Date }} meta
 */
function buildEmail(values, meta) {
  const subjectName = values.name.length > 60 ? values.name.slice(0, 57) + '...' : values.name;
  const subject = `Portfolio message from ${subjectName}`;
  const sent = meta.now.toISOString();

  const text = [
    `New message from the Neuroforge portfolio contact form.`,
    ``,
    `Name: ${values.name}`,
    `Email: ${values.email}`,
    `Sent: ${sent}`,
    ``,
    values.message,
    ``,
    `Reply to this email to answer ${values.name} directly.`,
    `Reference: ${meta.requestId}`,
  ].join('\n');

  const html = `<!doctype html>
<html lang="en"><body style="margin:0;padding:24px;background:#f4f4f2;font-family:Arial,Helvetica,sans-serif;color:#151a24;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d9d8d0;">
<tr><td style="padding:20px 24px;border-bottom:1px solid #d9d8d0;font-size:14px;color:#4a5468;">New message from the Neuroforge portfolio contact form</td></tr>
<tr><td style="padding:20px 24px;font-size:15px;line-height:1.5;">
<p style="margin:0 0 4px;"><strong>Name</strong><br>${escapeHtml(values.name)}</p>
<p style="margin:16px 0 4px;"><strong>Email</strong><br><a href="mailto:${escapeHtml(values.email)}" style="color:#1f4fbf;">${escapeHtml(values.email)}</a></p>
<p style="margin:16px 0 4px;"><strong>Message</strong></p>
<div style="white-space:pre-wrap;border-top:1px solid #d9d8d0;padding-top:12px;">${escapeHtml(values.message)}</div>
</td></tr>
<tr><td style="padding:14px 24px;border-top:1px solid #d9d8d0;font-size:12px;color:#5b6579;">Reply to this email to answer ${escapeHtml(values.name)} directly. Reference ${escapeHtml(meta.requestId)}. Sent ${escapeHtml(sent)}.</td></tr>
</table></body></html>`;

  return { subject, text, html };
}

/**
 * @typedef {{ apiKey: string, to: string, from: string, siteOrigins: string[], providerTimeoutMs: number, minFillMs: number }} Config
 */

/**
 * @param {Record<string, string | undefined>} env
 * @returns {{ ok: true, config: Config } | { ok: false, missing: string[] }}
 */
function readConfig(env) {
  const apiKey = (env.RESEND_API_KEY || '').trim();
  if (!apiKey) return { ok: false, missing: ['RESEND_API_KEY'] };
  const origins = (env.SITE_ORIGIN || DEFAULTS.siteOrigin)
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  return {
    ok: true,
    config: {
      apiKey,
      to: (env.CONTACT_TO_EMAIL || DEFAULTS.to).trim(),
      from: (env.CONTACT_FROM_EMAIL || DEFAULTS.from).trim(),
      siteOrigins: origins,
      providerTimeoutMs: Number(env.CONTACT_PROVIDER_TIMEOUT_MS) || DEFAULTS.providerTimeoutMs,
      minFillMs: env.CONTACT_MIN_FILL_MS === undefined ? DEFAULTS.minFillMs : Number(env.CONTACT_MIN_FILL_MS),
    },
  };
}

/**
 * Fixed-window, in-memory limiter. Serverless instances do not share memory, so this is a
 * best-effort brake against bursts, not a hard guarantee. For hard limits use a shared
 * store (see README, "Hardening").
 * @param {{ windowMs: number, max: number, now?: () => number }} opts
 */
function createRateLimiter({ windowMs, max, now = Date.now }) {
  /** @type {Map<string, { count: number, resetAt: number }>} */
  const hits = new Map();
  return {
    /** @param {string} key */
    check(key) {
      const t = now();
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= t) {
        hits.set(key, { count: 1, resetAt: t + windowMs });
        return { allowed: true, retryAfterSec: 0 };
      }
      if (entry.count >= max) {
        return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - t) / 1000)) };
      }
      entry.count += 1;
      return { allowed: true, retryAfterSec: 0 };
    },
  };
}

/**
 * Remembers recent submission ids so a double click or a retried request does not send twice
 * from the same warm instance. Resend's Idempotency-Key covers the cross-instance case.
 * @param {{ ttlMs: number, now?: () => number }} opts
 */
function createSubmissionMemory({ ttlMs, now = Date.now }) {
  /** @type {Map<string, { at: number, result: Result | null }>} */
  const seen = new Map();
  return {
    /** @param {string} id */
    get(id) {
      const e = seen.get(id);
      if (!e) return undefined;
      if (now() - e.at > ttlMs) { seen.delete(id); return undefined; }
      return e;
    },
    /** @param {string} id @param {Result | null} result */
    set(id, result) {
      if (seen.size > 2000) {
        const t = now();
        for (const [k, v] of seen) if (t - v.at > ttlMs) seen.delete(k);
      }
      seen.set(id, { at: now(), result });
    },
    /** @param {string} id */
    delete(id) { seen.delete(id); },
  };
}

/**
 * @typedef {{ status: number, body: Record<string, unknown>, headers?: Record<string, string> }} Result
 * @typedef {{ method?: string, headers: Record<string, string | string[] | undefined>, body: unknown, ip?: string }} ContactRequest
 * @typedef {{
 *   env: Record<string, string | undefined>,
 *   fetch: typeof fetch,
 *   limiter: ReturnType<typeof createRateLimiter>,
 *   emailLimiter: ReturnType<typeof createRateLimiter>,
 *   memory: ReturnType<typeof createSubmissionMemory>,
 *   now?: () => Date,
 *   log?: (event: string, fields: Record<string, unknown>) => void,
 * }} Deps
 */

/** @param {string | string[] | undefined} v */
function first(v) { return Array.isArray(v) ? v[0] : v; }

/**
 * Same-origin guard for browser posts. Accepts the configured site origins and the request's
 * own host (so preview deployments work). Requests with neither Origin nor Referer are refused.
 * @param {ContactRequest['headers']} headers
 * @param {string[]} allowed
 */
function originAllowed(headers, allowed) {
  const origin = first(headers.origin);
  const referer = first(headers.referer);
  const host = first(headers['x-forwarded-host']) || first(headers.host);
  let candidate = origin;
  if (!candidate && referer) {
    try { candidate = new URL(referer).origin; } catch { candidate = undefined; }
  }
  if (!candidate) return false;
  if (allowed.includes(candidate)) return true;
  try {
    const u = new URL(candidate);
    return !!host && u.host === host;
  } catch { return false; }
}

/** @param {string} v */
function hashKey(v) { return crypto.createHash('sha256').update(v.toLowerCase()).digest('hex').slice(0, 24); }

/**
 * @param {Config} config
 * @param {{ subject: string, text: string, html: string }} mail
 * @param {string} replyTo
 * @param {string} idempotencyKey
 * @param {typeof fetch} fetchImpl
 * @returns {Promise<{ ok: true, id: string } | { ok: false, providerStatus: number, providerError: string, kind: 'rejected' | 'timeout' | 'network' | 'conflict' | 'throttled' }>}
 */
async function sendWithResend(config, mail, replyTo, idempotencyKey, fetchImpl) {
  let res;
  try {
    res = await fetchImpl(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
        'User-Agent': 'neuroforge-portfolio-contact/1.0',
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: replyTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      }),
      signal: AbortSignal.timeout(config.providerTimeoutMs),
    });
  } catch (err) {
    const name = err && typeof err === 'object' && 'name' in err ? String(err.name) : 'Error';
    return { ok: false, providerStatus: 0, providerError: name, kind: name === 'TimeoutError' || name === 'AbortError' ? 'timeout' : 'network' };
  }

  /** @type {any} */
  let payload = null;
  try { payload = await res.json(); } catch { /* non JSON body */ }

  if (res.ok && payload && typeof payload.id === 'string' && payload.id) {
    return { ok: true, id: payload.id };
  }
  const providerError = payload && typeof payload.name === 'string' ? payload.name : 'unknown_error';
  if (res.status === 409) return { ok: false, providerStatus: res.status, providerError, kind: 'conflict' };
  if (res.status === 429) return { ok: false, providerStatus: res.status, providerError, kind: 'throttled' };
  return { ok: false, providerStatus: res.status, providerError, kind: 'rejected' };
}

/**
 * @param {ContactRequest} req
 * @param {Deps} deps
 * @returns {Promise<Result>}
 */
async function handleContact(req, deps) {
  const now = deps.now || (() => new Date());
  const log = deps.log || (() => {});
  const requestId = crypto.randomBytes(4).toString('hex');
  /** @param {number} status @param {Record<string, unknown>} body @param {Record<string, string>} [headers] @returns {Result} */
  const out = (status, body, headers) => ({ status, body: { requestId, ...body }, headers });

  if ((req.method || 'POST').toUpperCase() !== 'POST') {
    return out(405, { ok: false, code: 'method_not_allowed', message: 'Use POST.' }, { Allow: 'POST' });
  }

  const cfg = readConfig(deps.env);
  if (!cfg.ok) {
    log('contact.misconfigured', { requestId, missing: cfg.missing });
    return out(503, { ok: false, code: 'unavailable', message: 'The contact form is temporarily unavailable. Please email me directly.' });
  }
  const config = cfg.config;

  if (!originAllowed(req.headers, config.siteOrigins)) {
    log('contact.blocked', { requestId, reason: 'origin' });
    return out(403, { ok: false, code: 'forbidden', message: 'This request was not accepted.' });
  }

  const ctype = String(first(req.headers['content-type']) || '').toLowerCase();
  if (!ctype.includes('application/json') && !ctype.includes('application/x-www-form-urlencoded')) {
    return out(415, { ok: false, code: 'unsupported_media_type', message: 'Unsupported content type.' });
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    return out(400, { ok: false, code: 'bad_request', message: 'The request body could not be read.' });
  }
  const body = /** @type {Record<string, unknown>} */ (req.body);

  const ip = req.ip || 'unknown';
  const ipLimit = deps.limiter.check(`ip:${ip}`);
  if (!ipLimit.allowed) {
    log('contact.rate_limited', { requestId, scope: 'ip' });
    return out(429, { ok: false, code: 'rate_limited', retryAfter: ipLimit.retryAfterSec, message: 'Too many messages from this connection. Please wait a few minutes and try again.' }, { 'Retry-After': String(ipLimit.retryAfterSec) });
  }

  // Honeypot: a field real visitors never see or fill. Answer as if it worked so bots learn nothing.
  if (singleLine(body.contact_extra)) {
    log('contact.spam_dropped', { requestId, reason: 'honeypot' });
    return out(200, { ok: true });
  }
  const startedAt = Number(body.startedAt);
  if (Number.isFinite(startedAt) && startedAt > 0 && config.minFillMs > 0) {
    const elapsed = now().getTime() - startedAt;
    if (elapsed >= 0 && elapsed < config.minFillMs) {
      log('contact.spam_dropped', { requestId, reason: 'too_fast' });
      return out(200, { ok: true });
    }
  }

  const checked = validate(body);
  if (!checked.ok) {
    return out(400, { ok: false, code: 'validation', errors: checked.errors, message: 'Please correct the highlighted fields.' });
  }
  const { values } = checked;

  const emailLimit = deps.emailLimiter.check(`email:${hashKey(values.email)}`);
  if (!emailLimit.allowed) {
    log('contact.rate_limited', { requestId, scope: 'email' });
    return out(429, { ok: false, code: 'rate_limited', retryAfter: emailLimit.retryAfterSec, message: 'You have sent several messages recently. Please wait a little before sending another.' }, { 'Retry-After': String(emailLimit.retryAfterSec) });
  }

  const rawId = singleLine(body.submissionId);
  const submissionId = SUBMISSION_ID_RE.test(rawId) ? rawId : crypto.randomUUID();
  const previous = deps.memory.get(submissionId);
  if (previous) {
    if (previous.result && previous.result.status === 200) return out(200, { ok: true, duplicate: true });
    if (!previous.result) return out(409, { ok: false, code: 'in_progress', message: 'This message is already being sent.' });
  }
  deps.memory.set(submissionId, null);

  const mail = buildEmail(values, { requestId, now: now() });
  const sent = await sendWithResend(config, mail, values.email, `contact-${submissionId}`, deps.fetch);

  if (sent.ok) {
    deps.memory.set(submissionId, { status: 200, body: {} });
    log('contact.sent', { requestId, providerId: sent.id });
    return out(200, { ok: true });
  }

  deps.memory.delete(submissionId); // allow a legitimate retry
  log('contact.delivery_failed', { requestId, kind: sent.kind, providerStatus: sent.providerStatus, providerError: sent.providerError });
  if (sent.kind === 'conflict') {
    return out(409, { ok: false, code: 'in_progress', message: 'This message is already being sent.' });
  }
  if (sent.kind === 'throttled') {
    return out(503, { ok: false, code: 'unavailable', message: 'The mail service is busy. Please try again in a minute, or email me directly.' }, { 'Retry-After': '60' });
  }
  return out(502, { ok: false, code: 'delivery_failed', message: 'Your message could not be delivered. Nothing was sent. Please try again, or email me directly.' });
}

/** @param {unknown} v */
function wantsJson(v) {
  return String(Array.isArray(v) ? v[0] : v || '').includes('application/json');
}

/**
 * Writes a Result to a Node style response. Browsers using fetch get JSON. A plain form post
 * (JavaScript disabled) gets a small HTML page that tells the truth about the outcome.
 * @param {{ status: (n: number) => any, setHeader: (k: string, v: string) => any, send: (b: string) => any, json?: (b: unknown) => any }} res
 * @param {Result} result
 * @param {ContactRequest['headers']} reqHeaders
 */
function sendResult(res, result, reqHeaders) {
  res.setHeader('Cache-Control', 'no-store');
  for (const [k, v] of Object.entries(result.headers || {})) res.setHeader(k, v);
  if (wantsJson(reqHeaders.accept) || wantsJson(reqHeaders['content-type'])) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(result.status).send(JSON.stringify(result.body));
  }
  const ok = result.status === 200;
  const message = String(result.body.message || (ok ? 'Thank you. Your message has been sent.' : 'Your message was not sent.'));
  const errors = result.body.errors && typeof result.body.errors === 'object' ? Object.values(/** @type {Record<string,string>} */ (result.body.errors)) : [];
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${ok ? 'Message sent' : 'Message not sent'} | Neuroforge</title><link rel="stylesheet" href="/css/base.css"><link rel="stylesheet" href="/css/components.css"></head><body><main class="wrap notice-page"><h1>${ok ? 'Message sent' : 'Message not sent'}</h1><p>${escapeHtml(ok ? 'Thank you. I will reply to the address you provided.' : message)}</p>${errors.length ? `<ul>${errors.map((e) => `<li>${escapeHtml(String(e))}</li>`).join('')}</ul>` : ''}<p><a href="/#contact">Back to the contact form</a></p></main></body></html>`;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(result.status).send(page);
}

/**
 * @param {Record<string, string | string[] | undefined>} headers
 * @param {string | undefined} socketIp
 */
function clientIp(headers, socketIp) {
  const vercel = first(headers['x-vercel-forwarded-for']);
  if (vercel) return vercel.split(',')[0].trim();
  const xff = first(headers['x-forwarded-for']);
  if (xff) return xff.split(',')[0].trim();
  return socketIp || 'unknown';
}

/** Process wide dependencies for the real runtimes. */
function createRuntimeDeps() {
  return {
    env: process.env,
    fetch: globalThis.fetch,
    limiter: createRateLimiter({ windowMs: 10 * 60 * 1000, max: 5 }),
    emailLimiter: createRateLimiter({ windowMs: 15 * 60 * 1000, max: 3 }),
    memory: createSubmissionMemory({ ttlMs: 10 * 60 * 1000 }),
    log: (/** @type {string} */ event, /** @type {Record<string, unknown>} */ fields) => {
      const line = JSON.stringify({ t: new Date().toISOString(), event, ...fields });
      if (event === 'contact.sent' || event === 'contact.spam_dropped' || event === 'contact.rate_limited') console.log(line);
      else console.error(line);
    },
  };
}

module.exports = {
  LIMITS,
  DEFAULTS,
  validate,
  buildEmail,
  readConfig,
  createRateLimiter,
  createSubmissionMemory,
  handleContact,
  sendResult,
  sendWithResend,
  clientIp,
  createRuntimeDeps,
  escapeHtml,
  originAllowed,
};
