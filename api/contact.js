// @ts-check
'use strict';

/**
 * Vercel serverless function: POST /api/contact
 * All behaviour lives in lib/contact.js so it can be tested without a network.
 */
const { handleContact, sendResult, clientIp, createRuntimeDeps } = require('../lib/contact');

const deps = createRuntimeDeps();

/**
 * @param {any} req
 * @param {any} res
 */
module.exports = async function handler(req, res) {
  const ip = clientIp(req.headers, req.socket && req.socket.remoteAddress);
  const result = await handleContact(
    { method: req.method, headers: req.headers, body: req.body, ip },
    deps
  );
  sendResult(res, result, req.headers);
};
