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
    if (/@keyframes|from \{|to \{/.test(selector)) continue;
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
