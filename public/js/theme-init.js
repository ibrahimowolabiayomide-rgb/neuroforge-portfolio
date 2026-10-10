/* Runs before first paint, so a saved or system theme never flashes the wrong colours,
   and decides whether animation is allowed. Hidden "before" states in motion.css only
   exist while <html class="anim"> is present, so a failed script can never hide content:
   if motion.js has not started within four seconds the class is removed. */
(function () {
  var root = document.documentElement;
  var theme = null;
  try { theme = localStorage.getItem('neuroforge-theme'); } catch (e) { /* storage unavailable */ }
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  root.setAttribute('data-theme', theme);

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) {
    root.classList.add('anim');
    setTimeout(function () {
      if (!(/** @type {any} */ (window)).__nfMotion) root.classList.remove('anim');
    }, 4000);
  }
})();
