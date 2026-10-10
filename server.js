'use strict';

/**
 * Local development server: serves ./public exactly like production (static files plus the
 * same security headers from vercel.json) and mounts the contact API at /api/contact.
 * Production is Vercel; this file is not deployed.
 */
const path = require('path');
const fs = require('fs');
const express = require('express');
const { handleContact, sendResult, clientIp, createRuntimeDeps } = require('./lib/contact');

// Node 20.12+ can load a local .env without a dependency. Real secrets stay out of git.
try { process.loadEnvFile(path.join(__dirname, '.env')); } catch { /* no .env file, that is fine */ }

const PORT = process.env.PORT || 3000;
const app = express();
app.disable('x-powered-by');

// Mirror the global headers declared in vercel.json so local testing matches production.
try {
  const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
  const global = (cfg.headers || []).find((h) => h.source === '/(.*)');
  if (global) {
    app.use((req, res, next) => {
      for (const h of global.headers) res.setHeader(h.key, h.value);
      next();
    });
  }
} catch { /* optional */ }

const deps = createRuntimeDeps();
app.post(
  '/api/contact',
  express.json({ limit: '16kb' }),
  express.urlencoded({ extended: false, limit: '16kb' }),
  async (req, res) => {
    const ip = clientIp(req.headers, req.socket.remoteAddress);
    const result = await handleContact({ method: req.method, headers: req.headers, body: req.body, ip }, deps);
    sendResult(res, result, req.headers);
  }
);
app.all('/api/contact', (req, res) => {
  res.status(405).set('Allow', 'POST').json({ ok: false, code: 'method_not_allowed' });
});

// Malformed JSON bodies would otherwise surface as an HTML stack trace.
app.use((err, req, res, next) => {
  if (req.path === '/api/contact') return res.status(400).json({ ok: false, code: 'bad_request', message: 'The request body could not be read.' });
  return next(err);
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { extensions: ['html'] }));
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicDir, '404.html'));
});

app.listen(PORT, () => {
  console.log(`Neuroforge portfolio running at http://localhost:${PORT}`);
  if (!process.env.RESEND_API_KEY) console.log('RESEND_API_KEY is not set: the contact form will answer 503 until you add it to .env');
});
