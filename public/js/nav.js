// @ts-check
/* Navigation: the mobile menu and the "you are here" marker. Without JavaScript the links
   simply stay visible, so the menu button is hidden until this script runs. */
(function () {
  'use strict';
  var toggle = /** @type {HTMLButtonElement | null} */ (document.getElementById('nav-toggle'));
  var panel = /** @type {HTMLElement | null} */ (document.getElementById('nav-panel'));
  if (!toggle || !panel) return;
  var menu = /** @type {HTMLElement} */ (panel);
  var button = /** @type {HTMLButtonElement} */ (toggle);

  var small = window.matchMedia('(max-width: 859px)');
  var open = false;

  function render() {
    if (small.matches) {
      button.hidden = false;
      menu.hidden = !open;
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.querySelector('.label')
        && (/** @type {HTMLElement} */ (button.querySelector('.label')).textContent = open ? 'Close' : 'Menu');
    } else {
      open = false;
      button.hidden = true;
      menu.hidden = false;
      button.setAttribute('aria-expanded', 'false');
    }
  }
  button.addEventListener('click', function () { open = !open; render(); });
  menu.addEventListener('click', function (e) {
    var t = /** @type {HTMLElement} */ (e.target);
    if (t.closest && t.closest('a') && small.matches) { open = false; render(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && open && small.matches) { open = false; render(); button.focus(); }
  });
  if (small.addEventListener) small.addEventListener('change', render); else small.addListener(render);
  render();

  /* ---------- Current section marker (home page only) ---------- */
  var links = Array.prototype.slice.call(menu.querySelectorAll('a[href^="#"], a[href^="/#"]'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  /** @type {Map<string, Element>} */
  var byId = new Map();
  /** @type {HTMLElement[]} */
  var sections = [];
  links.forEach(function (a) {
    var id = (a.getAttribute('href') || '').replace(/^\/?#/, '');
    var sec = id && document.getElementById(id);
    if (sec) { byId.set(id, a); sections.push(sec); }
  });
  if (!sections.length) return;
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.removeAttribute('aria-current'); });
      var link = byId.get(e.target.id);
      if (link) link.setAttribute('aria-current', 'location');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { spy.observe(s); });
  // Clear the marker when the visitor is back at the top, above every linked section.
  window.addEventListener('scroll', function () {
    if (window.scrollY < 120) links.forEach(function (a) { a.removeAttribute('aria-current'); });
  }, { passive: true });
})();
