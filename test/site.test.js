'use strict';
// Static checks over the built site in public/: links, anchors, copy rules, CSP-safety,
// SEO basics and motion safety. No dependencies, runs with `npm test`.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const PUBLIC = path.join(__dirname, '..', 'public');
const ORIGIN = 'https://neuroforge-portfolio.vercel.app';

function walk(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return fs.statSync(full).isDirectory() ? walk(full) : [full];
  });
}
const files = walk(PUBLIC);
const pages = files.filter((f) => f.endsWith('.html'));
const rel = (f) => path.relative(PUBLIC, f).split(path.sep).join('/');
const read = (f) => fs.readFileSync(f, 'utf8');
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

function resolve(url) {
  const clean = url.split('#')[0].split('?')[0];
  if (!clean) return null;
  let target = path.join(PUBLIC, clean);
  if (clean.endsWith('/')) target = path.join(target, 'index.html');
  return target;
}
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&copy;/g, '(c)')
    .replace(/&amp;/g, '&');
}

test('the expected pages exist', () => {
  for (const p of ['index.html', '404.html', 'work/veyra/index.html', 'work/amoura/index.html', 'work/imperial-shelter-tech/index.html']) {
    assert.ok(fs.existsSync(path.join(PUBLIC, p)), p);
  }
});

test('every local link, asset and srcset candidate resolves', () => {
  for (const f of pages) {
    const html = read(f);
    for (const m of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const url = m[1];
      if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
      if (url.startsWith('#')) { assert.ok(ids(html).has(url.slice(1)), `${rel(f)}: missing anchor ${url}`); continue; }
      const target = resolve(url);
      assert.ok(target && fs.existsSync(target), `${rel(f)}: broken ${url}`);
      if (url.includes('#')) {
        assert.ok(ids(read(target)).has(url.split('#')[1]), `${rel(f)}: missing anchor in target ${url}`);
      }
    }
    for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
      for (const c of m[1].split(',')) {
        const target = resolve(c.trim().split(' ')[0]);
        assert.ok(target && fs.existsSync(target), `${rel(f)}: broken srcset ${c}`);
      }
    }
  }
});

test('visible copy has no dashes used as punctuation and no slashes', () => {
  for (const f of pages) {
    const html = read(f);
    const text = visibleText(html);  // includes the <title> text
    assert.ok(!/[–—]/.test(text), `${rel(f)}: en or em dash in text`);
    assert.ok(!/\//.test(text), `${rel(f)}: slash in visible text: ${(text.match(/.{0,25}\/.{0,25}/) || [''])[0].replace(/\s+/g, ' ')}`);
    const metas = [...html.matchAll(/<meta[^>]+(?:name|property)="(?:description|og:title|og:description|twitter:title|twitter:description)"[^>]+>/g)].map((m) => m[0]).join(' ');
    assert.ok(!/[–—]/.test(metas), `${rel(f)}: dash in meta`);
    assert.ok(!/content="[^"]*\/[^"]*"/.test(metas), `${rel(f)}: slash in meta`);
  }
});

test('no inline styles or scripts (the CSP forbids them)', () => {
  for (const f of pages) {
    const html = read(f);
    assert.ok(!/\sstyle="/.test(html), `${rel(f)}: inline style attribute`);
    assert.ok(!/<style[\s>]/.test(html), `${rel(f)}: style element`);
    assert.ok(!/<script(?![^>]*\ssrc=)(?![^>]*ld\+json)[^>]*>/.test(html), `${rel(f)}: inline script`);
    assert.ok(!/\son[a-z]+="/.test(html), `${rel(f)}: inline event handler`);
  }
});

test('document structure: one h1, a main landmark, a skip link, a footer after main', () => {
  for (const f of pages) {
    const html = read(f);
    assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${rel(f)}: h1 count`);
    assert.ok(/<main id="main"/.test(html), `${rel(f)}: main`);
    assert.ok(/class="skip-link" href="#main"/.test(html), `${rel(f)}: skip link`);
    assert.ok(/<\/main>\s*<footer/.test(html), `${rel(f)}: footer follows main`);
    assert.ok(/<html lang="en">/.test(html), `${rel(f)}: lang`);
    assert.ok(/name="viewport"/.test(html), `${rel(f)}: viewport`);
  }
});

test('external links open safely and announce the new tab', () => {
  for (const f of pages) {
    for (const m of read(f).matchAll(/<a [^>]*target="_blank"[^>]*>[\s\S]*?<\/a>/g)) {
      assert.ok(/rel="noopener"/.test(m[0]), `${rel(f)}: target blank without noopener`);
      assert.ok(/opens in a new tab/.test(m[0]), `${rel(f)}: new tab not announced`);
    }
  }
});

test('indexable pages have a canonical URL that is listed in the sitemap', () => {
  const sitemap = read(path.join(PUBLIC, 'sitemap.xml'));
  for (const f of pages) {
    const html = read(f);
    if (/name="robots" content="noindex/.test(html)) continue;
    const canonical = (html.match(/rel="canonical" href="([^"]+)"/) || [])[1];
    assert.ok(canonical, `${rel(f)}: canonical`);
    assert.ok(sitemap.includes(`<loc>${canonical}</loc>`), `${rel(f)}: canonical missing from sitemap`);
    assert.ok(/property="og:image" content="https:\/\/[^"]+"/.test(html), `${rel(f)}: og:image`);
  }
  for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    assert.ok(m[1].startsWith(ORIGIN), 'sitemap origin');
    assert.ok(!m[1].includes('#'), 'no fragments in sitemap');
    const target = resolve(m[1].slice(ORIGIN.length));
    assert.ok(fs.existsSync(target), `sitemap url missing on disk: ${m[1]}`);
  }
  assert.ok(/Disallow: \/api\//.test(read(path.join(PUBLIC, 'robots.txt'))));
});

test('the 404 page is not indexable', () => {
  assert.ok(/name="robots" content="noindex/.test(read(path.join(PUBLIC, '404.html'))));
});

test('the contact form markup keeps the ids and fields site.js and the API rely on', () => {
  const html = read(path.join(PUBLIC, 'index.html'));
  for (const id of ['contact-form', 'cf-name', 'cf-email', 'cf-message', 'cf-submit', 'cf-status', 'cf-sent', 'cf-reset', 'cf-name-error', 'cf-email-error', 'cf-message-error', 'theme-toggle', 'nav-toggle', 'nav-panel']) {
    assert.ok(ids(html).has(id), `missing #${id}`);
  }
  assert.ok(/action="\/api\/contact" method="post"/.test(html));
  for (const field of ['name="contact_extra"', 'name="startedAt"', 'name="submissionId"']) assert.ok(html.includes(field), field);
  assert.ok(!/re_[A-Za-z0-9]{10,}/.test(html), 'no key-shaped strings in the page');
});

test('the home page carries every planned section', () => {
  const html = read(path.join(PUBLIC, 'index.html'));
  for (const id of ['work', 'capabilities', 'approach', 'about', 'contact']) assert.ok(ids(html).has(id), `section #${id}`);
  for (const slug of ['veyra', 'amoura', 'imperial-shelter-tech']) assert.ok(html.includes(`href="/work/${slug}/"`), `link to ${slug}`);
});

test('motion safety: hidden states are gated, reduced motion is honoured, scrolling is untouched', () => {
  const motion = read(path.join(PUBLIC, 'css', 'motion.css'));
  const base = read(path.join(PUBLIC, 'css', 'base.css'));
  assert.ok(/prefers-reduced-motion: reduce/.test(motion), 'reduced-motion block');
  assert.ok(/prefers-reduced-motion: no-preference/.test(motion), 'motion is opt-in');
  // Every rule that hides content must sit under .anim.
  const hiding = motion.split('}').filter((block) => /opacity: 0;|translate: 0 108%|clip-path: inset\(0 100%/.test(block) && /\{/.test(block));
  for (const block of hiding) {
    const selector = block.split('{')[0];
    // Keyframe selectors (from, to, 20%) describe an animation, they cannot be gated by .anim.
    if (/@keyframes/.test(selector) || /^\s*(from|to|\d+%)(\s*,\s*(from|to|\d+%))*\s*$/.test(selector)) continue;
    assert.ok(/\.anim\b/.test(selector.replace(/\s+/g, ' ')), `unguarded hiding rule: ${selector.trim().slice(0, 80)}`);
  }
  const js = read(path.join(PUBLIC, 'js', 'motion.js')) + read(path.join(PUBLIC, 'js', 'nav.js'));
  assert.ok(!/addEventListener\(\s*['"](wheel|mousewheel|touchmove|touchstart)['"]/.test(js), 'no wheel or touch listeners');
  for (const bad of ['preventDefault', "behavior: 'smooth'", 'scroll-behavior']) assert.ok(!js.includes(bad), `scroll-affecting code: ${bad}`);
  assert.ok(!/scroll-behavior\s*:\s*smooth/.test(base + motion), 'no smooth-scroll');
  const init = read(path.join(PUBLIC, 'js', 'theme-init.js'));
  assert.ok(/anim/.test(init) && /4000/.test(init), 'failsafe removes the anim class');
});

test('styles avoid the effects the design rules out', () => {
  const css = ['base', 'components', 'sections', 'case', 'motion'].map((n) => read(path.join(PUBLIC, 'css', `${n}.css`))).join('\n');
  for (const k of ['backdrop-filter', 'blur(', 'text-shadow', 'cursor: none', 'border-left: 4px', 'border-left: 3px']) {
    assert.ok(!css.includes(k), `css contains ${k}`);
  }
  assert.ok(!/!important/.test(css.replace(/@media \(prefers-reduced-motion: reduce\)[\s\S]*$/, '')), '!important outside the reduced-motion block');
});

test('fonts are self-hosted and licensed, and no third party origins are used', () => {
  for (const f of pages) {
    const html = read(f);
    for (const m of html.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) {
      const u = m[1];
      const ok = /^https:\/\/(github\.com|www\.linkedin\.com|x\.com|wa\.me|t\.me|[a-z0-9-]+\.vercel\.app)\//.test(u) || /<link rel="canonical"/.test(m.input.slice(Math.max(0, m.index - 30), m.index));
      assert.ok(ok, `${rel(f)}: unexpected external URL ${u}`);
    }
  }
  const css = read(path.join(PUBLIC, 'css', 'base.css'));
  assert.ok(!/https?:\/\//.test(css), 'no remote URLs in css');
  for (const n of ['OFL-Bricolage-Grotesque', 'OFL-Instrument-Sans', 'OFL-Instrument-Serif', 'OFL-JetBrains-Mono']) {
    assert.ok(fs.existsSync(path.join(PUBLIC, 'assets', 'fonts', `${n}.txt`)), `licence ${n}`);
  }
});

test('the old stylesheet is gone and nothing references it', () => {
  assert.ok(!fs.existsSync(path.join(PUBLIC, 'css', 'site.css')));
  for (const f of [...pages, path.join(__dirname, '..', 'lib', 'contact.js')]) assert.ok(!read(f).includes('/css/site.css'), `${f} references site.css`);
});

// ---------------------------------------------------------------------------------------------
// Branding: the owner's name leads, and no personal location is used as brand identity.
// ---------------------------------------------------------------------------------------------
const NAME = 'Ibrahim Owolabi';

test('no personal location in branding: every Ibadan mention is the Imperial client description', () => {
  const texts = files.filter((f) => /\.(html|css|js|xml|txt|svg|json)$/.test(f));
  for (const f of texts) {
    for (const line of read(f).split('\n')) {
      if (!/Ibadan/i.test(line)) continue;
      assert.ok(/consultancy in Ibadan/.test(line), `${rel(f)}: unexpected location reference: ${line.trim().slice(0, 90)}`);
    }
  }
  for (const f of pages) {
    const html = read(f);
    const head = html.slice(0, html.indexOf('</head>'));
    assert.ok(!/Ibadan|Nigeria/i.test(head), `${rel(f)}: location in head metadata or structured data`);
    const footer = html.slice(html.indexOf('<footer'));
    assert.ok(!/Ibadan|Nigeria/i.test(footer), `${rel(f)}: location in footer`);
  }
});

test('the owner name is the primary brand in titles, metadata and the header', () => {
  for (const f of pages) {
    const html = read(f);
    const title = (html.match(/<title>([^<]+)<\/title>/) || [])[1] || '';
    assert.ok(title.includes(NAME), `${rel(f)}: title lacks the name: ${title}`);
    assert.ok(html.includes(`<meta name="author" content="${NAME}">`), `${rel(f)}: author`);
    assert.ok(html.includes(`aria-label="${NAME}, home"`), `${rel(f)}: brand label`);
    assert.ok(/class="brand-name">Ibrahim Owolabi</.test(html), `${rel(f)}: header name`);
    if (!/noindex/.test(html)) {
      assert.ok(html.includes(`<meta property="og:site_name" content="${NAME}">`), `${rel(f)}: og:site_name`);
      assert.ok(new RegExp(`og:image:alt" content="${NAME}`).test(html), `${rel(f)}: og:image:alt`);
    }
  }
});

test('structured data is valid JSON, names the owner and carries no address', () => {
  const html = read(path.join(PUBLIC, 'index.html'));
  const m = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(m, 'ld+json present');
  const data = JSON.parse(m[1]);
  assert.equal(data['@type'], 'Person');
  assert.equal(data.name, NAME);
  assert.equal(data.alternateName, 'Neuroforge');
  assert.ok(!('address' in data), 'no address in structured data');
  assert.ok(typeof data.jobTitle === 'string' && /developer/i.test(data.jobTitle));
});

test('the social preview image is 1200 by 630', () => {
  const buf = fs.readFileSync(path.join(PUBLIC, 'assets', 'img', 'og.png'));
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
});

test('motion.js only adds pointer effects for fine pointers, and every new loop is tied to visibility', () => {
  const js = read(path.join(PUBLIC, 'js', 'motion.js'));
  assert.ok(/\(hover: hover\) and \(pointer: fine\)/.test(js), 'fine pointer gate');
  assert.ok(/data-live/.test(js) && /is-live/.test(js), 'live toggle');
  const css = read(path.join(PUBLIC, 'css', 'motion.css'));
  for (const sel of ['.pipeline.is-live', '[data-live].is-in.is-live']) assert.ok(css.includes(sel), `ambient loop gated by ${sel}`);
  // Every infinite animation must sit under the no-preference block.
  const infinite = css.slice(0, css.indexOf('@media (prefers-reduced-motion: reduce)')).match(/infinite/g) || [];
  assert.ok(infinite.length > 0);
  assert.ok(css.indexOf('infinite') > css.indexOf('prefers-reduced-motion: no-preference'));
});

// ---------------------------------------------------------------------------------------------
// Contact links: each one opens the right destination, with a draft where the platform allows.
// ---------------------------------------------------------------------------------------------
function channelLinks() {
  const html = read(path.join(PUBLIC, 'index.html'));
  const out = {};
  for (const m of html.matchAll(/<li><a href="([^"]+)"[^>]*><span class="kind">([^<]+)<\/span>/g)) {
    out[m[2]] = m[1].replace(/&amp;/g, '&');
  }
  return out;
}

test('contact links keep the owner\'s real addresses and open drafts the visitor can edit', () => {
  const links = channelLinks();
  assert.deepEqual(Object.keys(links), ['Email', 'WhatsApp', 'Telegram', 'GitHub', 'LinkedIn', 'X']);

  // Email: a mailto to the existing address, with a subject and a body introducing the enquiry.
  const mail = new URL(links.Email);
  assert.equal(mail.protocol, 'mailto:');
  assert.equal(decodeURIComponent(mail.pathname), 'ibrahimowolabiayomide@gmail.com');
  assert.match(mail.searchParams.get('subject'), /enquiry/i);
  const body = mail.searchParams.get('body');
  assert.match(body, /^Hello Ibrahim,/);
  assert.match(body, /portfolio/);
  assert.match(body, /Kind regards,\s*$/);

  // WhatsApp and Telegram: the existing number and username, with the same short draft.
  const wa = new URL(links.WhatsApp);
  assert.equal(wa.origin + wa.pathname, 'https://wa.me/2348167653702');
  const tg = new URL(links.Telegram);
  assert.equal(tg.origin + tg.pathname, 'https://t.me/L0p3r7');
  for (const u of [wa, tg]) {
    const text = u.searchParams.get('text');
    assert.match(text, /^Hello Ibrahim,/);
    assert.match(text, /project/);
    assert.ok(text.length > 40 && text.length < 400, 'short enough to read before sending');
    assert.ok(!/sent|has been sent/i.test(text), 'the draft never claims to be sent');
  }

  // LinkedIn and X: the existing profile addresses, unchanged. Neither platform accepts a draft on a profile link.
  assert.equal(links.LinkedIn, 'https://www.linkedin.com/in/ibrahim-owolabi-ayomide-7bb61740b');
  assert.equal(links.X, 'https://x.com/nextgenmid74091');
  assert.equal(links.GitHub, 'https://github.com/ibrahimowolabiayomide-rgb');
});

test('the page says drafts are not sent automatically', () => {
  const html = read(path.join(PUBLIC, 'index.html'));
  assert.match(html, /class="channels-note">[^<]*Nothing is sent until you press send/);
});

test('the form fallback link in site.js uses the same address and subject', () => {
  const js = read(path.join(PUBLIC, 'js', 'site.js'));
  assert.ok(js.includes("EMAIL_FALLBACK = 'ibrahimowolabiayomide@gmail.com'"));
  assert.ok(/subject=.*encodeURIComponent\('Project enquiry from your portfolio'\)/.test(js));
});
