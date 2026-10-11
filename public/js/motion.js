// @ts-check
/* Neuroforge motion. Small on purpose: it only decides WHEN things appear. How they move
   is defined in css/motion.css. Scrolling itself is never touched: no wheel handlers, no
   smooth-scroll, no scroll locking. */
(function () {
  'use strict';
  var root = document.documentElement;
  /** @type {any} */ (window).__nfMotion = true;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animated = root.classList.contains('anim') && !reduce;

  /* ---------- Active step in the approach list (state, not motion) ---------- */
  var steps = document.querySelectorAll('.step');
  if (steps.length && 'IntersectionObserver' in window) {
    var stepIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) {
        steps.forEach(function (s) { s.classList.toggle('is-active', s === e.target); });
      } });
    }, { rootMargin: '-35% 0px -55% 0px' });
    steps.forEach(function (s) { stepIO.observe(s); });
  } else {
    steps.forEach(function (s) { s.classList.add('is-active'); });
  }

  if (!animated) return;

  /* ---------- Split headings into words so they can rise out of a mask ---------- */
  /** @param {Node} node @param {{n: number}} counter */
  function splitWords(node, counter) {
    var kids = Array.prototype.slice.call(node.childNodes);
    kids.forEach(function (kid) {
      if (kid.nodeType === 3) {
        var parts = (kid.textContent || '').split(/(\s+)/);
        var frag = document.createDocumentFragment();
        parts.forEach(/** @param {string} part */ function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var mask = document.createElement('span');
          mask.className = 'w';
          mask.style.setProperty('--i', String(Math.min(counter.n++, 14)));
          var inner = document.createElement('span');
          inner.textContent = part;
          mask.appendChild(inner);
          frag.appendChild(mask);
        });
        node.replaceChild(frag, kid);
      } else if (kid.nodeType === 1) {
        splitWords(kid, counter);
      }
    });
  }
  document.querySelectorAll('[data-reveal="words"]').forEach(function (el) { splitWords(el, { n: 0 }); });

  /* ---------- Reveal on entry. Once per element, never blocks scrolling ---------- */
  var targets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('is-in'); });
  }

  /* ---------- Progress bar fallback for browsers without scroll timelines ---------- */
  var bar = document.querySelector('.progress');
  var hasTimeline = window.CSS && CSS.supports && CSS.supports('animation-timeline: scroll()');
  if (bar && !hasTimeline) {
    var ticking = false;
    var paint = function () {
      var h = root.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      /** @type {HTMLElement} */ (bar).style.transform = 'scaleX(' + p.toFixed(4) + ')';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    paint();
  }

  /* ---------- Things that only run while they are on screen ---------- */
  /* Elements marked data-live get .is-live while visible; their ambient loops in motion.css
     read that class, so nothing animates off screen. Starts after the hero entrance. */
  var liveEls = document.querySelectorAll('[data-live]');
  if (liveEls.length && 'IntersectionObserver' in window) {
    var liveIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('is-live', e.isIntersecting); });
    }, { threshold: 0.2 });
    setTimeout(function () { liveEls.forEach(function (el) { liveIO.observe(el); }); }, 3400);
  }

  /* ---------- Pointer-aware surfaces (fine pointers only) ---------- */
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!fine) return;

  /** @param {number} v @param {number} lo @param {number} hi */
  function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }

  /* Hero: the glyph drifts in depth and a soft light follows the pointer. Both ease toward the
     pointer on one rAF loop that stops by itself once everything has settled. */
  var hero = /** @type {HTMLElement | null} */ (document.querySelector('.hero'));
  var layers = document.querySelectorAll('[data-depth]');
  if (hero) {
    var stage = hero;
    var glow = document.createElement('div');
    glow.className = 'hero-glow';
    glow.setAttribute('aria-hidden', 'true');
    stage.appendChild(glow);

    var tx = 0, ty = 0, cx = 0, cy = 0;          // depth: target and current, -0.5 to 0.5
    var tgx = 0, tgy = 0, gx = 0, gy = 0;        // glow: target and current, in pixels
    var placed = false, raf = 0;

    var frame = function () {
      raf = 0;
      cx += (tx - cx) * 0.09; cy += (ty - cy) * 0.09;
      gx += (tgx - gx) * 0.12; gy += (tgy - gy) * 0.12;
      layers.forEach(function (el) {
        var d = Number(/** @type {HTMLElement} */ (el).dataset.depth) || 0;
        /** @type {HTMLElement} */ (el).style.translate = (cx * d).toFixed(2) + 'px ' + (cy * d).toFixed(2) + 'px';
      });
      glow.style.translate = gx.toFixed(1) + 'px ' + gy.toFixed(1) + 'px';
      if (Math.abs(tx - cx) > 0.0004 || Math.abs(ty - cy) > 0.0004 || Math.abs(tgx - gx) > 0.2 || Math.abs(tgy - gy) > 0.2) {
        raf = requestAnimationFrame(frame);
      }
    };
    var kick = function () { if (!raf) raf = requestAnimationFrame(frame); };

    stage.addEventListener('pointermove', /** @param {PointerEvent} ev */ function (ev) {
      var r = stage.getBoundingClientRect();
      tx = (ev.clientX - r.left) / r.width - 0.5;
      ty = (ev.clientY - r.top) / r.height - 0.5;
      tgx = ev.clientX - r.left;
      tgy = ev.clientY - r.top;
      if (!placed) { gx = tgx; gy = tgy; placed = true; }   // appear under the pointer instead of flying in
      stage.classList.add('is-aware');
      kick();
    }, { passive: true });
    stage.addEventListener('pointerleave', function () {
      tx = 0; ty = 0;
      stage.classList.remove('is-aware');
      kick();
    });
  }

  /* Product visuals tilt toward the pointer. The section is the pointer area, so the tilt
     builds up gradually as the pointer crosses it. CSS turns --px and --py into the movement. */
  document.querySelectorAll('[data-tilt]').forEach(function (node) {
    var el = /** @type {HTMLElement} */ (node);
    var area = /** @type {HTMLElement} */ (el.closest('.chapter, .case-hero') || el);
    var nx = 0, ny = 0, queued = false;
    area.addEventListener('pointermove', /** @param {PointerEvent} ev */ function (ev) {
      var r = area.getBoundingClientRect();
      nx = (ev.clientX - r.left) / r.width - 0.5;
      ny = (ev.clientY - r.top) / r.height - 0.5;
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        el.style.setProperty('--px', nx.toFixed(3));
        el.style.setProperty('--py', ny.toFixed(3));
        queued = false;
      });
    }, { passive: true });
    area.addEventListener('pointerleave', function () {
      el.style.setProperty('--px', '0');
      el.style.setProperty('--py', '0');
    });
  });

  /* Cards: a spotlight follows the pointer across the card. */
  document.querySelectorAll('.layer, .flow li').forEach(function (node) {
    var card = /** @type {HTMLElement} */ (node);
    card.addEventListener('pointermove', /** @param {PointerEvent} ev */ function (ev) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (ev.clientX - r.left).toFixed(0) + 'px');
      card.style.setProperty('--my', (ev.clientY - r.top).toFixed(0) + 'px');
    }, { passive: true });
  });

  /* Buttons: a small pull toward the pointer, and the light inside them follows it. The CSS
     transition on translate does the easing, so this only sets targets. */
  document.querySelectorAll('.btn-ember, .btn-line').forEach(function (node) {
    var btn = /** @type {HTMLElement} */ (node);
    btn.addEventListener('pointermove', /** @param {PointerEvent} ev */ function (ev) {
      if (btn.getAttribute('aria-disabled') === 'true') return;
      var r = btn.getBoundingClientRect();
      btn.style.setProperty('--sx', (((ev.clientX - r.left) / r.width) * 100).toFixed(1) + '%');
      btn.style.setProperty('--sy', (((ev.clientY - r.top) / r.height) * 100).toFixed(1) + '%');
      var dx = ev.clientX - (r.left + r.width / 2);
      var dy = ev.clientY - (r.top + r.height / 2);
      btn.style.translate = clamp(dx * 0.12, -6, 6).toFixed(1) + 'px ' + clamp(dy * 0.18, -4, 4).toFixed(1) + 'px';
    }, { passive: true });
    btn.addEventListener('pointerleave', function () { btn.style.translate = ''; });
  });
})();
