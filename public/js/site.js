// @ts-check
/* Neuroforge: theme toggle and contact form. Navigation lives in nav.js and animation timing in motion.js.
   1. the theme toggle is hidden until this script runs, so there is no dead button without JS
   2. the contact form posts JSON to /api/contact and reports the real outcome.
   Without JavaScript the form still posts normally and the server replies with a plain page. */
(function () {
  'use strict';

  /* ---------- Theme ---------- */
  var root = document.documentElement;
  var toggle = /** @type {HTMLButtonElement | null} */ (document.getElementById('theme-toggle'));

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }
  function paintToggle() {
    if (!toggle) return;
    toggle.textContent = currentTheme() === 'light' ? 'Dark theme' : 'Light theme';
  }
  if (toggle) {
    toggle.hidden = false;
    paintToggle();
    var button = toggle;
    button.addEventListener('click', function () {
      var next = currentTheme() === 'light' ? 'dark' : 'light';
      var apply = function () {
        root.setAttribute('data-theme', next);
        paintToggle();
      };
      try { localStorage.setItem('neuroforge-theme', next); } catch (e) { /* storage unavailable */ }

      // Where the browser can, the new theme spreads outward from the button. Everywhere else
      // (and for visitors who reduce motion) the theme simply changes.
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var vt = /** @type {any} */ (document).startViewTransition;
      if (calm || typeof vt !== 'function') { apply(); return; }
      var box = button.getBoundingClientRect();
      root.style.setProperty('--tx', Math.round(box.left + box.width / 2) + 'px');
      root.style.setProperty('--ty', Math.round(box.top + box.height / 2) + 'px');
      root.classList.add('theme-vt');
      var run = vt.call(document, apply);
      var done = function () { root.classList.remove('theme-vt'); };
      if (run && run.finished && typeof run.finished.then === 'function') run.finished.then(done, done); else done();
    });
  }

  /* ---------- Contact form ---------- */
  const form = /** @type {HTMLFormElement} */ (document.getElementById('contact-form'));
  if (!form) return;

  var FIELDS = ['name', 'email', 'message'];
  var MIN_FILL_MS = 1600;          // the server drops posts faster than 1.5s after page load
  var REQUEST_TIMEOUT_MS = 15000;  // longer than the server's own provider timeout
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var EMAIL_FALLBACK = 'ibrahimowolabiayomide@gmail.com';

  var submitBtn = /** @type {HTMLButtonElement} */ (document.getElementById('cf-submit'));
  var statusBox = /** @type {HTMLElement} */ (document.getElementById('cf-status'));
  var sentBox = /** @type {HTMLElement} */ (document.getElementById('cf-sent'));
  var resetBtn = /** @type {HTMLButtonElement} */ (document.getElementById('cf-reset'));
  var startedAtInput = /** @type {HTMLInputElement} */ (form.elements.namedItem('startedAt'));
  var submissionInput = /** @type {HTMLInputElement} */ (form.elements.namedItem('submissionId'));
  var pending = false;

  var loadedAt = Date.now();
  startedAtInput.value = String(loadedAt);

  function newId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') return window.crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }
  submissionInput.value = newId();

  /** @param {string} name */
  function field(name) { return /** @type {HTMLInputElement | HTMLTextAreaElement} */ (form.elements.namedItem(name)); }
  /** @param {string} name */
  function errorEl(name) { return /** @type {HTMLElement} */ (document.getElementById('cf-' + name + '-error')); }

  /** @param {string} name @param {string} message */
  function setError(name, message) {
    var input = field(name);
    var el = errorEl(name);
    input.setAttribute('aria-invalid', 'true');
    el.textContent = message;
    el.hidden = false;
  }
  /** @param {string} name */
  function clearError(name) {
    var input = field(name);
    var el = errorEl(name);
    input.removeAttribute('aria-invalid');
    el.textContent = '';
    el.hidden = true;
  }
  function clearAllErrors() { FIELDS.forEach(clearError); }

  /** @param {'error' | 'success' | 'info'} kind @param {string} title @param {string} text @param {boolean} [withEmail] */
  function showStatus(kind, title, text, withEmail) {
    statusBox.className = 'form-status' + (kind === 'error' ? ' is-error' : kind === 'success' ? ' is-success' : '');
    statusBox.textContent = '';
    var strong = document.createElement('strong');
    strong.textContent = title;
    var p = document.createElement('p');
    p.appendChild(document.createTextNode(text));
    if (withEmail) {
      p.appendChild(document.createTextNode(' You can also write to '));
      var a = document.createElement('a');
      a.href = 'mailto:' + EMAIL_FALLBACK + '?subject=' + encodeURIComponent('Project enquiry from your portfolio');
      a.textContent = EMAIL_FALLBACK;
      p.appendChild(a);
      p.appendChild(document.createTextNode('.'));
    }
    statusBox.appendChild(strong);
    statusBox.appendChild(p);
    statusBox.hidden = false;
  }
  function hideStatus() { statusBox.hidden = true; statusBox.textContent = ''; }

  /** @param {boolean} on */
  function setPending(on) {
    pending = on;
    form.setAttribute('aria-busy', on ? 'true' : 'false');
    submitBtn.setAttribute('aria-disabled', on ? 'true' : 'false');
    submitBtn.textContent = on ? 'Sending' : 'Send message';
  }

  /** Returns a map of field to message, empty when valid. Mirrors the server rules. */
  function validate() {
    /** @type {Record<string, string>} */
    var errors = {};
    var name = field('name').value.trim();
    var email = field('email').value.trim();
    var message = field('message').value.trim();
    if (!name) errors.name = 'Enter your name.';
    else if (name.length > 100) errors.name = 'Keep your name under 100 characters.';
    if (!email) errors.email = 'Enter your email address.';
    else if (email.length > 254 || !EMAIL_RE.test(email)) errors.email = 'Enter a valid email address, for example name@example.com.';
    if (!message) errors.message = 'Write a message.';
    else if (message.length < 10) errors.message = 'Write at least 10 characters so I have something to reply to.';
    else if (message.length > 4000) errors.message = 'Keep the message under 4000 characters.';
    return errors;
  }

  /** @param {Record<string, string>} errors */
  function applyErrors(errors) {
    clearAllErrors();
    /** @type {HTMLInputElement | HTMLTextAreaElement | null} */
    var first = null;
    for (var i = 0; i < FIELDS.length; i++) {
      var name = FIELDS[i];
      if (errors[name]) {
        setError(name, errors[name]);
        if (!first) first = field(name);
      }
    }
    var count = Object.keys(errors).length;
    if (count) {
      showStatus('error', 'Message not sent', count === 1 ? 'One field needs attention.' : count + ' fields need attention.');
      if (first) first.focus();
    }
  }

  /** @param {number} ms */
  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }

  FIELDS.forEach(function (name) {
    var input = field(name);
    input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') clearError(name);
      // Edited content is a new message: it must not reuse an earlier attempt's id.
      if (!pending) submissionInput.value = newId();
    });
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (pending) return;

    var errors = validate();
    if (Object.keys(errors).length) { applyErrors(errors); return; }
    clearAllErrors();
    hideStatus();
    setPending(true);

    var payload = {
      name: field('name').value,
      email: field('email').value,
      message: field('message').value,
      contact_extra: /** @type {HTMLInputElement} */ (form.elements.namedItem('contact_extra')).value,
      startedAt: startedAtInput.value,
      submissionId: submissionInput.value
    };

    // Never post faster than the server's spam check allows: a real visitor with autofill must not lose a message.
    var elapsed = Date.now() - loadedAt;
    if (elapsed < MIN_FILL_MS) await wait(MIN_FILL_MS - elapsed);

    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);
    try {
      var res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      /** @type {any} */
      var data = null;
      try { data = await res.json(); } catch (e) { data = null; }

      if (res.ok && data && data.ok === true) {
        form.reset();
        loadedAt = Date.now();
        startedAtInput.value = String(loadedAt);
        submissionInput.value = newId();
        form.hidden = true;
        sentBox.hidden = false;
        sentBox.focus();
        return;
      }
      if (res.status === 400 && data && data.errors) {
        applyErrors(data.errors);
      } else if (res.status === 429) {
        var secs = data && Number(data.retryAfter);
        var when = secs && secs > 0 ? ' Try again in about ' + Math.ceil(secs / 60) + ' minute' + (Math.ceil(secs / 60) === 1 ? '' : 's') + '.' : ' Please wait a few minutes and try again.';
        showStatus('error', 'Message not sent', 'There have been too many attempts.' + when, true);
        statusBox.focus();
      } else if (res.status === 409) {
        showStatus('info', 'Still sending', 'This message is already being sent. Give it a moment before trying again.');
        statusBox.focus();
      } else {
        showStatus('error', 'Message not sent', 'Your message could not be delivered, and nothing was sent.', true);
        statusBox.focus();
      }
    } catch (err) {
      var aborted = err && /** @type {any} */ (err).name === 'AbortError';
      showStatus('error', 'Message not sent',
        aborted ? 'The server took too long to answer, so I cannot confirm delivery. Trying again is safe.'
                : 'The message could not reach the server. Check your connection and try again.', true);
      statusBox.focus();
    } finally {
      clearTimeout(timer);
      setPending(false);
    }
  });

  resetBtn.addEventListener('click', function () {
    sentBox.hidden = true;
    form.hidden = false;
    hideStatus();
    field('name').focus();
  });
})();
