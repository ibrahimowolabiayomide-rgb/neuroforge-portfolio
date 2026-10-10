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

  /* ---------- Pointer depth on the hero (fine pointers only) ---------- */
  var hero = /** @type {HTMLElement | null} */ (document.querySelector('.hero'));
  var layers = document.querySelectorAll('[data-depth]');
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (hero && layers.length && fine) {
    var stage = hero;
    var px = 0, py = 0, queued = false;
    stage.addEventListener('pointermove', /** @param {PointerEvent} ev */ function (ev) {
      var r = stage.getBoundingClientRect();
      px = (ev.clientX - r.left) / r.width - 0.5;
      py = (ev.clientY - r.top) / r.height - 0.5;
      if (!queued) {
        queued = true;
        requestAnimationFrame(function () {
          layers.forEach(function (el) {
            var d = Number(/** @type {HTMLElement} */ (el).dataset.depth) || 0;
            /** @type {HTMLElement} */ (el).style.translate = (px * d).toFixed(1) + 'px ' + (py * d).toFixed(1) + 'px';
          });
          queued = false;
        });
      }
    }, { passive: true });
  }
})();
