// Visit alert: sends a Telegram message to the owner's phone when someone opens the portfolio.
// Needs two Vercel environment variables: TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.
// No IP address is stored or sent; only country/city (approximate), device, browser and referrer.

const BOT_RE = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|pingdom|uptime|monitor|vercel|curl|wget|python|node-fetch|axios/i;

function describeDevice(ua) {
  const device = /iPad|Tablet/i.test(ua)
    ? 'Tablet'
    : /Mobi|Android|iPhone/i.test(ua)
    ? 'Phone'
    : 'Desktop';
  let os = 'Unknown OS';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iOS/i.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';
  let browser = 'Unknown browser';
  if (/Edg\//i.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';
  else if (/Chrome|CriOS/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua)) browser = 'Safari';
  return `${device} · ${os} · ${browser}`;
}

function safe(value, max = 120) {
  return String(value || '')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, max);
}

function decodeHeader(value) {
  try {
    return decodeURIComponent(value || '');
  } catch {
    return value || '';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    return res.status(200).json({ ok: false, reason: 'not-configured' });
  }

  const ua = req.headers['user-agent'] || '';
  if (!ua || BOT_RE.test(ua)) {
    return res.status(200).json({ ok: true, skipped: 'bot' });
  }

  // Only accept calls coming from your own site.
  const origin = req.headers.origin || '';
  const host = req.headers.host || '';
  if (origin && !origin.includes(host)) {
    return res.status(403).json({ ok: false });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const country = safe(req.headers['x-vercel-ip-country'], 10) || '?';
  const city = safe(decodeHeader(req.headers['x-vercel-ip-city']), 60);
  const place = city ? `${city}, ${country}` : country;
  const referrer = safe(body.ref) || 'Direct / unknown';
  const page = safe(body.path) || '/';
  const when = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date());

  const text = [
    '👀 New portfolio visit',
    `📍 ${place}`,
    `📱 ${describeDevice(ua)}`,
    `🔗 From: ${referrer}`,
    `📄 Page: ${page}`,
    `🕐 ${when} (WAT)`,
  ].join('\n');

  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.status(200).json({ ok: r.ok });
  } catch {
    return res.status(200).json({ ok: false });
  }
}
