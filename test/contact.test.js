'use strict';
// Run with: npm test  (uses the built-in Node test runner, no dependencies)
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validate, buildEmail, readConfig, createRateLimiter, createSubmissionMemory,
  handleContact, sendResult, clientIp, escapeHtml,
} = require('../lib/contact');

const ORIGIN = 'https://neuroforge-portfolio.vercel.app';
const ENV = {
  RESEND_API_KEY: 're_test_key',
  CONTACT_TO_EMAIL: 'inbox@example.com',
  CONTACT_FROM_EMAIL: 'Neuroforge <contact@example.com>',
  SITE_ORIGIN: ORIGIN,
};

function goodBody(extra = {}) {
  return { name: 'Ada Lovelace', email: 'ada@example.com', message: 'I would like to talk about a project.', submissionId: 'sub-12345678', ...extra };
}
function req(body = goodBody(), headers = {}) {
  return {
    method: 'POST',
    headers: { origin: ORIGIN, host: 'neuroforge-portfolio.vercel.app', 'content-type': 'application/json', accept: 'application/json', ...headers },
    body,
    ip: '203.0.113.7',
  };
}
function makeDeps(overrides = {}) {
  const calls = [];
  const logs = [];
  const deps = {
    env: ENV,
    fetch: async (url, init) => {
      calls.push({ url, init, payload: JSON.parse(init.body) });
      return { ok: true, status: 200, json: async () => ({ id: 'resend_msg_1' }) };
    },
    limiter: createRateLimiter({ windowMs: 60000, max: 5 }),
    emailLimiter: createRateLimiter({ windowMs: 60000, max: 3 }),
    memory: createSubmissionMemory({ ttlMs: 60000 }),
    now: () => new Date('2026-10-09T10:00:00Z'),
    log: (event, fields) => logs.push({ event, ...fields }),
    ...overrides,
  };
  return { deps, calls, logs };
}

test('validate accepts good input and trims it', () => {
  const r = validate({ name: '  Ada  ', email: ' ada@example.com ', message: '  Hello there, friend.  ' });
  assert.equal(r.ok, true);
  assert.deepEqual(r.values, { name: 'Ada', email: 'ada@example.com', message: 'Hello there, friend.' });
});

test('validate reports each failing field', () => {
  const r = validate({ name: '', email: 'nope', message: 'short' });
  assert.equal(r.ok, false);
  assert.deepEqual(Object.keys(r.errors).sort(), ['email', 'message', 'name']);
});

test('validate enforces length limits and ignores non-string junk', () => {
  assert.equal(validate({ name: 'a'.repeat(101), email: 'a@b.co', message: 'x'.repeat(20) }).ok, false);
  assert.equal(validate({ name: 'a', email: 'a@b.co', message: 'x'.repeat(4001) }).ok, false);
  assert.equal(validate({ name: { a: 1 }, email: ['a@b.co'], message: 12345678901 }).ok, false);
});

test('validate strips header injection characters from name and email', () => {
  const r = validate({ name: 'Ada\r\nBcc: evil@example.com', email: 'ada@example.com', message: 'A long enough message.' });
  assert.equal(r.ok, true);
  assert.ok(!/[\r\n]/.test(r.values.name));
  const bad = validate({ name: 'Ada', email: 'ada@example.com\r\nBcc: evil@example.com', message: 'A long enough message.' });
  assert.equal(bad.ok, false, 'an email containing a line break must not validate');
});

test('buildEmail escapes HTML and keeps the subject on one line', () => {
  const { subject, html, text } = buildEmail(
    { name: '<script>alert(1)</script>', email: 'a@b.co', message: '<img src=x onerror=alert(1)>\nline two' },
    { requestId: 'abc12345', now: new Date('2026-10-09T10:00:00Z') }
  );
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('<img'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!/[\r\n]/.test(subject));
  assert.ok(text.includes('line two'));
});

test('readConfig requires the API key and applies defaults', () => {
  assert.deepEqual(readConfig({}), { ok: false, missing: ['RESEND_API_KEY'] });
  const c = readConfig({ RESEND_API_KEY: 'k' });
  assert.equal(c.ok, true);
  assert.equal(c.config.to, 'ibrahimowolabiayomide@gmail.com');
  assert.deepEqual(c.config.siteOrigins, ['https://neuroforge-portfolio.vercel.app']);
});

test('success: calls Resend once with reply_to, recipient, sender and idempotency key', async () => {
  const { deps, calls, logs } = makeDeps();
  const r = await handleContact(req(), deps);
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
  assert.equal(calls.length, 1);
  const c = calls[0];
  assert.equal(c.url, 'https://api.resend.com/emails');
  assert.equal(c.init.headers.Authorization, 'Bearer re_test_key');
  assert.equal(c.init.headers['Idempotency-Key'], 'contact-sub-12345678');
  assert.equal(c.payload.reply_to, 'ada@example.com');
  assert.deepEqual(c.payload.to, ['inbox@example.com']);
  assert.equal(c.payload.from, 'Neuroforge <contact@example.com>');
  assert.match(c.payload.subject, /Ada Lovelace/);
  const sent = logs.find((l) => l.event === 'contact.sent');
  assert.ok(sent);
  assert.ok(!JSON.stringify(logs).includes('I would like to talk'), 'message text must never be logged');
  assert.ok(!JSON.stringify(logs).includes('ada@example.com'), 'visitor email must never be logged');
});

test('provider rejection is NOT reported as success', async () => {
  const { deps, logs } = makeDeps({
    fetch: async () => ({ ok: false, status: 403, json: async () => ({ name: 'validation_error', message: 'domain not verified' }) }),
  });
  const r = await handleContact(req(), deps);
  assert.equal(r.status, 502);
  assert.equal(r.body.ok, false);
  assert.equal(r.body.code, 'delivery_failed');
  const f = logs.find((l) => l.event === 'contact.delivery_failed');
  assert.equal(f.providerStatus, 403);
  assert.equal(f.providerError, 'validation_error');
});

test('a 200 response without a message id is NOT reported as success', async () => {
  const { deps } = makeDeps({ fetch: async () => ({ ok: true, status: 200, json: async () => ({}) }) });
  const r = await handleContact(req(), deps);
  assert.equal(r.status, 502);
});

test('network failure and timeout are reported as delivery failures', async () => {
  for (const name of ['TimeoutError', 'TypeError']) {
    const { deps, logs } = makeDeps({ fetch: async () => { const e = new Error('x'); e.name = name; throw e; } });
    const r = await handleContact(req(), deps);
    assert.equal(r.status, 502);
    assert.equal(logs.find((l) => l.event === 'contact.delivery_failed').kind, name === 'TimeoutError' ? 'timeout' : 'network');
  }
});

test('provider throttling maps to 503 with Retry-After', async () => {
  const { deps } = makeDeps({ fetch: async () => ({ ok: false, status: 429, json: async () => ({ name: 'rate_limit_exceeded' }) }) });
  const r = await handleContact(req(), deps);
  assert.equal(r.status, 503);
  assert.equal(r.headers['Retry-After'], '60');
});

test('missing API key answers 503 and logs which variable is missing', async () => {
  const { deps, logs } = makeDeps({ env: { ...ENV, RESEND_API_KEY: '' } });
  const r = await handleContact(req(), deps);
  assert.equal(r.status, 503);
  assert.deepEqual(logs.find((l) => l.event === 'contact.misconfigured').missing, ['RESEND_API_KEY']);
});

test('validation errors return 400 with field messages and send nothing', async () => {
  const { deps, calls } = makeDeps();
  const r = await handleContact(req(goodBody({ email: 'bad' })), deps);
  assert.equal(r.status, 400);
  assert.equal(r.body.code, 'validation');
  assert.ok(r.body.errors.email);
  assert.equal(calls.length, 0);
});

test('cross-origin and origin-less posts are refused', async () => {
  const { deps, calls } = makeDeps();
  assert.equal((await handleContact(req(goodBody(), { origin: 'https://evil.example' }), deps)).status, 403);
  const noOrigin = req(goodBody());
  delete noOrigin.headers.origin;
  assert.equal((await handleContact(noOrigin, deps)).status, 403);
  assert.equal(calls.length, 0);
});

test('same-host preview deployments are accepted', async () => {
  const { deps } = makeDeps();
  const r = await handleContact(req(goodBody(), { origin: 'https://neuroforge-git-feature.vercel.app', host: 'neuroforge-git-feature.vercel.app' }), deps);
  assert.equal(r.status, 200);
});

test('wrong content type is refused', async () => {
  const { deps } = makeDeps();
  assert.equal((await handleContact(req(goodBody(), { 'content-type': 'text/plain' }), deps)).status, 415);
});

test('non-POST is refused with Allow header', async () => {
  const { deps } = makeDeps();
  const r = await handleContact({ ...req(), method: 'GET' }, deps);
  assert.equal(r.status, 405);
  assert.equal(r.headers.Allow, 'POST');
});

test('honeypot submissions look successful but send nothing', async () => {
  const { deps, calls } = makeDeps();
  const r = await handleContact(req(goodBody({ contact_extra: 'https://spam.example' })), deps);
  assert.equal(r.status, 200);
  assert.equal(calls.length, 0);
});

test('submissions faster than a human can type are dropped silently', async () => {
  const { deps, calls } = makeDeps();
  const startedAt = new Date('2026-10-09T10:00:00Z').getTime() - 300;
  const r = await handleContact(req(goodBody({ startedAt })), deps);
  assert.equal(r.status, 200);
  assert.equal(calls.length, 0);
  const slowEnough = new Date('2026-10-09T10:00:00Z').getTime() - 20000;
  const r2 = await handleContact(req(goodBody({ startedAt: slowEnough, submissionId: 'sub-87654321' })), deps);
  assert.equal(r2.status, 200);
  assert.equal(calls.length, 1);
});

test('per-IP rate limit returns 429 with Retry-After after 5 requests', async () => {
  const { deps } = makeDeps({ emailLimiter: createRateLimiter({ windowMs: 60000, max: 100 }) });
  let last;
  for (let i = 0; i < 6; i++) last = await handleContact(req(goodBody({ email: `u${i}@example.com`, submissionId: `sub-aaaaaaa${i}` })), deps);
  assert.equal(last.status, 429);
  assert.ok(Number(last.headers['Retry-After']) >= 1);
});

test('per-email rate limit returns 429 after 3 messages from the same address', async () => {
  const { deps } = makeDeps({ limiter: createRateLimiter({ windowMs: 60000, max: 100 }) });
  let last;
  for (let i = 0; i < 4; i++) last = await handleContact(req(goodBody({ submissionId: `sub-bbbbbbb${i}` })), deps);
  assert.equal(last.status, 429);
});

test('the same submission id never sends twice (double click or retry)', async () => {
  const { deps, calls } = makeDeps();
  const a = await handleContact(req(), deps);
  const b = await handleContact(req(), deps);
  assert.equal(a.status, 200);
  assert.equal(b.status, 200);
  assert.equal(b.body.duplicate, true);
  assert.equal(calls.length, 1);
});

test('a request that arrives while the same id is in flight gets 409', async () => {
  let release;
  const gate = new Promise((r) => { release = r; });
  const { deps, calls } = makeDeps({
    fetch: async (url, init) => { calls_push(init); await gate; return { ok: true, status: 200, json: async () => ({ id: 'x' }) }; },
  });
  const seen = [];
  function calls_push(i) { seen.push(i); }
  const first = handleContact(req(), deps);
  await new Promise((r) => setImmediate(r));
  const second = await handleContact(req(), deps);
  assert.equal(second.status, 409);
  release();
  assert.equal((await first).status, 200);
  assert.equal(seen.length, 1);
  void calls;
});

test('a failed delivery can be retried with the same submission id', async () => {
  let n = 0;
  const { deps } = makeDeps({
    fetch: async () => (++n === 1 ? { ok: false, status: 500, json: async () => ({}) } : { ok: true, status: 200, json: async () => ({ id: 'ok' }) }),
  });
  assert.equal((await handleContact(req(), deps)).status, 502);
  assert.equal((await handleContact(req(), deps)).status, 200);
});

test('form posts without JavaScript get an honest HTML page', () => {
  const headers = {};
  let status, body;
  const res = { setHeader: (k, v) => { headers[k] = v; }, status(n) { status = n; return this; }, send(b) { body = b; return this; } };
  sendResult(res, { status: 502, body: { ok: false, message: 'Your message could not be delivered.' } }, { accept: 'text/html', 'content-type': 'application/x-www-form-urlencoded' });
  assert.equal(status, 502);
  assert.match(headers['Content-Type'], /text\/html/);
  assert.match(body, /Message not sent/);
  assert.ok(!/Message sent</.test(body));
});

test('JSON clients get JSON and no caching', () => {
  const headers = {};
  let body;
  const res = { setHeader: (k, v) => { headers[k] = v; }, status() { return this; }, send(b) { body = b; return this; } };
  sendResult(res, { status: 200, body: { ok: true } }, { accept: 'application/json' });
  assert.equal(headers['Cache-Control'], 'no-store');
  assert.deepEqual(JSON.parse(body), { ok: true });
});

test('clientIp prefers the platform header and falls back safely', () => {
  assert.equal(clientIp({ 'x-vercel-forwarded-for': '1.1.1.1, 2.2.2.2' }, '9.9.9.9'), '1.1.1.1');
  assert.equal(clientIp({ 'x-forwarded-for': '3.3.3.3' }, '9.9.9.9'), '3.3.3.3');
  assert.equal(clientIp({}, '9.9.9.9'), '9.9.9.9');
  assert.equal(clientIp({}, undefined), 'unknown');
});

test('escapeHtml escapes the five dangerous characters', () => {
  assert.equal(escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
});
