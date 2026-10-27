/* Visit alert: tells /api/visit that someone opened the portfolio.
   - Sends once per browser tab session (no repeat pings on reload or page changes).
   - Skips localhost, bots/automation, and your own devices.
   - To mute your own phone/laptop: open the site once with ?me=1 at the end of the address.
     (?me=0 turns alerts back on for that device.) */
(function () {
  try {
    var q = new URLSearchParams(location.search);
    if (q.get('me') === '1') localStorage.setItem('nf_owner', '1');
    if (q.get('me') === '0') localStorage.removeItem('nf_owner');
    if (localStorage.getItem('nf_owner') === '1') return;
  } catch (e) {}

  if (/^(localhost|127\.|0\.0\.0\.0)/.test(location.hostname)) return;
  if (navigator.webdriver) return;

  try {
    if (sessionStorage.getItem('nf_visit_sent')) return;
    sessionStorage.setItem('nf_visit_sent', '1');
  } catch (e) {}

  var ref = '';
  try {
    ref = document.referrer ? new URL(document.referrer).hostname : '';
  } catch (e) {}

  var payload = JSON.stringify({ path: location.pathname, ref: ref });
  try {
    fetch('/api/visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(function () {});
  } catch (e) {}
})();
