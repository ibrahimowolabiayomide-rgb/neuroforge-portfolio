/* ============================================
   NEUROFORGE — MAIN INTERACTIVITY
   Vanilla JS, no framework, no build step.
   ============================================ */
(function(){
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- LIVE VISITOR CLOCK ---------- */
  (function visitorClock(){
    const navTime = document.getElementById('navClockTime');
    const navLoc = document.getElementById('navClockLoc');
    const heroTime = document.getElementById('heroClockTime');
    const heroLoc = document.getElementById('heroClockLoc');
    if(!navTime && !heroTime) return;

    let timeZone = null;
    try{ timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone; }catch(e){}

    function fallbackLabel(){
      if(!timeZone) return 'Local time';
      const city = timeZone.split('/').pop().replace(/_/g, ' ');
      return city + ' Time';
    }

    function tick(){
      const now = new Date();
      const opts = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      if(timeZone) opts.timeZone = timeZone;
      let formatted;
      try{ formatted = new Intl.DateTimeFormat('en-US', opts).format(now); }
      catch(e){ formatted = now.toLocaleTimeString('en-US'); }
      if(navTime) navTime.textContent = formatted;
      if(heroTime) heroTime.textContent = formatted;
    }

    tick();
    setInterval(tick, 1000);

    function setLocationLabel(label){
      if(navLoc) navLoc.textContent = label;
      if(heroLoc) heroLoc.textContent = label;
    }

    // Start with timezone-derived label immediately (no network dependency)
    setLocationLabel(fallbackLabel());

    // Then try to upgrade to a real city/country name via IP geolocation.
    // Both providers are free, keyless, and CORS-enabled. If both fail
    // (offline, ad-blocker, rate limit), the timezone label above stands.
    async function resolveLocation(){
      try{
        const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined });
        const data = await res.json();
        if(data && data.success !== false && data.city && data.country){
          setLocationLabel(`${data.city}, ${data.country}`);
          return;
        }
        throw new Error('ipwho.is incomplete response');
      }catch(e){
        try{
          const res2 = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined });
          const data2 = await res2.json();
          if(data2 && !data2.error && data2.city && data2.country_name){
            setLocationLabel(`${data2.city}, ${data2.country_name}`);
          }
        }catch(e2){ /* keep timezone-derived fallback label */ }
      }
    }
    resolveLocation();
  })();

  (function setFooterYear(){
    const yearEl = document.getElementById('footYear');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
  })();

  /* ---------- GENUINE, COMPUTED "YEARS BUILDING" FIGURE ----------
     Derived from FOUNDING_YEAR in data.js rather than hardcoded, so
     it's always accurate and never needs manual updating. */
  (function yearsSince(){
    if(typeof FOUNDING_YEAR === 'undefined') return;
    const years = Math.max(1, new Date().getFullYear() - FOUNDING_YEAR);
    const label = years + '+ Years';
    const a = document.getElementById('factSince');
    const b = document.getElementById('factBandSince');
    if(a) a.textContent = label;
    if(b) b.textContent = label;
  })();

  /* ---------- STAGGERED HERO TITLE REVEAL ---------- */
  (function heroTitleReveal(){
    const words = document.querySelectorAll('#heroTitle .title-word');
    if(!words.length) return;
    if(reduceMotion){ words.forEach(w => w.classList.add('is-in')); return; }
    words.forEach((w, i) => {
      setTimeout(() => w.classList.add('is-in'), 150 + i * 130);
    });
  })();

  /* ---------- THEME TOGGLE ---------- */
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  const THEME_KEY = 'neuroforge-theme';

  function applyTheme(t){
    body.setAttribute('data-theme', t);
    themeToggle.setAttribute('aria-pressed', t === 'light' ? 'true' : 'false');
    try{ localStorage.setItem(THEME_KEY, t); }catch(e){}
  }
  (function initTheme(){
    let saved = null;
    try{ saved = localStorage.getItem(THEME_KEY); }catch(e){}
    if(saved){ applyTheme(saved); }
    else{
      const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(prefersLight ? 'light' : 'dark');
    }
  })();
  themeToggle.addEventListener('click', () => {
    const current = body.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ---------- NAV: scroll state + mobile burger ---------- */
  const nav = document.getElementById('siteNav');
  const navLinks = document.getElementById('navLinks');
  const navBurger = document.getElementById('navBurger');

  function onScroll(){
    if(window.scrollY > 30) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  navBurger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('is-open');
    navBurger.classList.toggle('is-active', isOpen);
    navBurger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('is-open');
      navBurger.classList.remove('is-active');
      navBurger.setAttribute('aria-expanded', 'false');
    });
  });

  /* ---------- NAV: highlight the current section while scrolling ---------- */
  (function navActiveSection(){
    const sectionIds = ['about','services','stack','work','experience','contact'];
    const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
    const navAnchors = Array.from(navLinks.querySelectorAll('a[href^="#"]'))
      .filter(a => !a.classList.contains('nav-cta-mobile'));
    if(!sections.length || !('IntersectionObserver' in window)) return;

    function setCurrent(id){
      navAnchors.forEach(a => {
        const isMatch = a.getAttribute('href') === '#' + id;
        a.classList.toggle('is-current', isMatch);
        if(isMatch) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }

    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio);
      if(visible.length) setCurrent(visible[0].target.id);
    }, { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

    sections.forEach(s => io.observe(s));
  })();

  /* ---------- TYPING ANIMATION FOR ROLES ---------- */
  (function typeRoles(){
    const el = document.getElementById('typedRole');
    if(!el || typeof ROLES === 'undefined') return;
    if(reduceMotion){ el.textContent = ROLES[0]; return; }

    let roleIndex = 0, charIndex = 0, deleting = false;
    const TYPE_SPEED = 55, DELETE_SPEED = 32, HOLD = 1800;

    function tick(){
      const word = ROLES[roleIndex];
      if(!deleting){
        charIndex++;
        el.textContent = word.slice(0, charIndex);
        if(charIndex === word.length){
          deleting = true;
          setTimeout(tick, HOLD);
          return;
        }
        setTimeout(tick, TYPE_SPEED);
      } else {
        charIndex--;
        el.textContent = word.slice(0, charIndex);
        if(charIndex === 0){
          deleting = false;
          roleIndex = (roleIndex + 1) % ROLES.length;
          setTimeout(tick, 350);
          return;
        }
        setTimeout(tick, DELETE_SPEED);
      }
    }
    setTimeout(tick, 900);
  })();

  /* ---------- HERO MOUSE-FOLLOW GLOW ----------
     The only motion in the hero background — a soft, subtle blue
     glow that tracks the cursor. No particle canvas. */
  (function heroGlow(){
    const hero = document.querySelector('.hero');
    const glow = document.getElementById('heroGlow');
    if(!hero || !glow || reduceMotion) return;
    if(window.matchMedia('(max-width: 780px)').matches) return;

    let raf = null;
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      if(raf) return;
      raf = requestAnimationFrame(() => {
        glow.style.setProperty('--gx', x + '%');
        glow.style.setProperty('--gy', y + '%');
        raf = null;
      });
    }, { passive: true });
    hero.addEventListener('pointerenter', () => glow.classList.add('is-active'));
    hero.addEventListener('pointerleave', () => glow.classList.remove('is-active'));
  })();

  /* ---------- MAGNETIC BUTTONS ---------- */
  (function magneticButtons(){
    if(reduceMotion) return;
    if(window.matchMedia('(max-width: 780px)').matches) return;
    const buttons = document.querySelectorAll('.hero-ctas .btn, .btn-primary');
    buttons.forEach(btn => {
      btn.addEventListener('pointermove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      }, { passive: true });
      btn.addEventListener('pointerleave', () => {
        btn.style.transform = '';
      }, { passive: true });
    });
  })();

  /* expose helpers to subsequent IIFEs in this file via window if needed */
  window.__nfReduceMotion = reduceMotion;

})();
/* ============================================
   NEUROFORGE — PART 2: content rendering
   (services, stack, projects, process, why),
   build notice, contact form, scroll reveal
   ============================================ */
(function(){
  'use strict';
  const reduceMotion = window.__nfReduceMotion;

  /* ---------- SCROLL REVEAL (IntersectionObserver) ---------- */
  (function revealOnScroll(){
    const targets = document.querySelectorAll('.reveal');
    if(!('IntersectionObserver' in window) || reduceMotion){
      targets.forEach(t => t.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(t => io.observe(t));
  })();

  /* ---------- SERVICES: render from data ---------- */
  (function services(){
    const grid = document.getElementById('servicesGrid');
    if(!grid || typeof SERVICES === 'undefined') return;
    grid.innerHTML = SERVICES.map(s => `
      <div class="service-card">
        <div class="service-icon">${s.icon}</div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>
    `).join('');
  })();

  /* ---------- PROCESS: render from data (a real ordered sequence) ---------- */
  (function process(){
    const list = document.getElementById('processList');
    if(!list || typeof PROCESS === 'undefined') return;
    list.innerHTML = PROCESS.map(step => `
      <div class="process-step">
        <span class="process-num">${step.num}</span>
        <h3>${step.title}</h3>
        <p>${step.desc}</p>
      </div>
    `).join('');
  })();

  /* ---------- WHY WORK WITH ME: render from data ---------- */
  (function why(){
    const grid = document.getElementById('whyGrid');
    if(!grid || typeof WHY_POINTS === 'undefined') return;
    grid.innerHTML = WHY_POINTS.map(w => `
      <div class="why-card">
        <div class="why-icon">${w.icon}</div>
        <h3>${w.title}</h3>
        <p>${w.desc}</p>
      </div>
    `).join('');
  })();

  /* ---------- TECH STACK: build chip panels from data, tab switching ---------- */
  (function stack(){
    const panelsWrap = document.getElementById('skillPanels');
    const tabs = document.querySelectorAll('.skill-tab');
    if(!panelsWrap || typeof SKILLS === 'undefined') return;

    Object.keys(SKILLS).forEach(cat => {
      const panel = panelsWrap.querySelector(`.skill-panel[data-cat="${cat}"]`);
      if(!panel) return;
      panel.innerHTML = `<div class="skill-chip-grid">${SKILLS[cat].map(skill => `
        <div class="skill-chip">${skill.icon}<span>${skill.name}</span></div>
      `).join('')}</div>`;
    });

    function activateTab(tab, opts){
      opts = opts || {};
      const cat = tab.getAttribute('data-cat');
      tabs.forEach(t => {
        const isActive = t === tab;
        t.classList.toggle('is-active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        t.tabIndex = isActive ? 0 : -1;
      });
      panelsWrap.querySelectorAll('.skill-panel').forEach(p => p.classList.remove('is-active'));
      const target = panelsWrap.querySelector(`.skill-panel[data-cat="${cat}"]`);
      if(target) target.classList.add('is-active');
      if(opts.focus) tab.focus();
    }

    const tabList = Array.from(tabs);
    tabList.forEach(tab => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', (e) => {
        const idx = tabList.indexOf(tab);
        let newIdx = null;
        if(e.key === 'ArrowRight' || e.key === 'ArrowDown'){ newIdx = (idx + 1) % tabList.length; }
        else if(e.key === 'ArrowLeft' || e.key === 'ArrowUp'){ newIdx = (idx - 1 + tabList.length) % tabList.length; }
        else if(e.key === 'Home'){ newIdx = 0; }
        else if(e.key === 'End'){ newIdx = tabList.length - 1; }
        if(newIdx !== null){
          e.preventDefault();
          activateTab(tabList[newIdx], { focus: true });
        }
      });
    });
  })();

  /* ---------- PROJECTS: render grid, filter, modal ---------- */
  (function projects(){
    const grid = document.getElementById('projectGrid');
    if(!grid || typeof PROJECTS === 'undefined') return;

    function statusBadgeHTML(p){
      if(p.status === 'client'){
        return `<span class="status-badge is-client"><span class="dot"></span>Client Project</span>`;
      }
      return `<span class="status-badge is-dev"><span class="dot"></span>Under Development</span>`;
    }

    function thumbHTML(p, idx){
      const img = p.logo
        ? `<img src="${p.logo}" alt="${p.title} logo" loading="lazy">`
        : `<img src="${p.img}" alt="${p.title} project screenshot" loading="lazy">`;
      return `<div class="project-thumb"><span class="project-index">${String(idx + 1).padStart(2,'0')}</span>${img}</div>`;
    }

    function cardHTML(p, idx){
      return `
        <article class="project-card" data-cats="${p.cats.join(' ')}" data-id="${p.id}" tabindex="0" role="button" aria-label="View case study: ${p.title}">
          ${thumbHTML(p, idx)}
          <div class="project-body">
            <div class="project-card-top">
              <h3 class="project-card-title">${p.title}</h3>
              ${statusBadgeHTML(p)}
            </div>
            <div class="project-meta-row">
              <div class="project-meta-item"><span class="lbl">Built For</span><span class="val">${p.builtFor}</span></div>
              <div class="project-meta-item"><span class="lbl">My Role</span><span class="val">${p.role}</span></div>
              <div class="project-meta-item"><span class="lbl">Capability</span><span class="val">${p.capability}</span></div>
            </div>
            <p class="project-card-desc">${p.short}</p>
            <div class="project-card-foot">
              <div class="tag-row">${p.tags.slice(0,4).map(t => `<span class="pill">${t}</span>`).join('')}</div>
              <span class="project-view-link">View Case Study <span class="arrow">↗</span></span>
            </div>
          </div>
        </article>
      `;
    }

    grid.innerHTML = PROJECTS.map(cardHTML).join('');

    /* Filtering — smooth fade/scale transition instead of an instant show/hide */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const FILTER_OUT_MS = 220;
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => { b.classList.remove('is-active'); b.setAttribute('aria-pressed','false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed','true');
        const filter = btn.getAttribute('data-filter');
        const cards = Array.from(grid.querySelectorAll('.project-card'));

        if(reduceMotion){
          cards.forEach(card => {
            const cats = card.getAttribute('data-cats').split(' ');
            card.classList.toggle('is-hidden', !(filter === 'all' || cats.includes(filter)));
          });
          return;
        }

        const toHide = [], toShow = [];
        cards.forEach(card => {
          const cats = card.getAttribute('data-cats').split(' ');
          const show = filter === 'all' || cats.includes(filter);
          if(show){ toShow.push(card); } else if(!card.classList.contains('is-hidden')){ toHide.push(card); }
        });

        toHide.forEach(card => card.classList.add('is-filtering-out'));

        setTimeout(() => {
          toHide.forEach(card => { card.classList.add('is-hidden'); card.classList.remove('is-filtering-out'); });
          let shownIndex = 0;
          toShow.forEach(card => {
            if(card.classList.contains('is-hidden')){
              card.classList.remove('is-hidden');
              card.classList.add('is-filtering-out');
              void card.offsetWidth; // force reflow so the transition runs
              card.style.transitionDelay = (shownIndex * 40) + 'ms';
              requestAnimationFrame(() => card.classList.remove('is-filtering-out'));
              shownIndex++;
              setTimeout(() => { card.style.transitionDelay = ''; }, 400);
            }
          });
        }, toHide.length ? FILTER_OUT_MS : 0);
      });
    });

    /* Modal */
    const modal = document.getElementById('projectModal');
    const modalImg = document.getElementById('modalImg');
    const modalYear = document.getElementById('modalYear');
    const modalTitle = document.getElementById('modalTitle');
    const modalDesc = document.getElementById('modalDesc');
    const modalFeatures = document.getElementById('modalFeatures');
    const modalTags = document.getElementById('modalTags');
    const modalDemo = document.getElementById('modalDemo');
    const modalRepo = document.getElementById('modalRepo');
    const modalClose = document.getElementById('modalClose');
    let lastFocused = null;

    function openModal(project){
      const src = project.logo || project.img;
      modalImg.src = src;
      modalImg.alt = project.title + (project.logo ? ' logo' : ' project screenshot');
      modalImg.classList.toggle('is-logo-panel', !!project.logo);
      modalYear.textContent = project.badgeText + ' · ' + project.year;
      modalTitle.textContent = project.title;
      modalDesc.textContent = project.desc;
      modalFeatures.innerHTML = project.features.map(f => `<li>${f}</li>`).join('');
      modalTags.innerHTML = project.tags.map(t => `<span class="pill">${t}</span>`).join('');
      modalDemo.href = project.demo;
      modalRepo.href = project.repo;
      modalDemo.style.display = project.demo === '#' ? 'none' : '';
      modalRepo.style.display = project.repo === '#' ? 'none' : '';
      lastFocused = document.activeElement;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      modalClose.focus();
    }
    function closeModal(){
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
      if(lastFocused) lastFocused.focus();
    }

    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.project-card');
      if(!card) return;
      const project = PROJECTS.find(p => p.id === card.getAttribute('data-id'));
      if(project) openModal(project);
    });
    grid.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' '){
        const card = e.target.closest('.project-card');
        if(!card) return;
        e.preventDefault();
        const project = PROJECTS.find(p => p.id === card.getAttribute('data-id'));
        if(project) openModal(project);
      }
    });
    function getFocusable(container){
      return Array.from(container.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.offsetParent !== null);
    }

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if(e.target === modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
      if(!modal.classList.contains('is-open')) return;
      if(e.key === 'Escape'){ closeModal(); return; }
      if(e.key === 'Tab'){
        const panel = modal.querySelector('.modal-box') || modal;
        const focusable = getFocusable(panel);
        if(!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if(e.shiftKey && document.activeElement === first){
          e.preventDefault();
          last.focus();
        } else if(!e.shiftKey && document.activeElement === last){
          e.preventDefault();
          first.focus();
        }
      }
    });
  })();

  /* ---------- FIRST-VISIT "CURRENTLY BUILDING" NOTIFICATION ----------
     Data-driven from BUILDING_NOW in data.js. Shows once per browser
     (localStorage-gated), dismissible, never blocks the page. To
     remove a shipped product from the notice, just set its `active`
     flag to false in data.js — no changes needed here. */
  (function buildNotice(){
    const notice = document.getElementById('buildNotice');
    const textEl = document.getElementById('buildNoticeText');
    const closeBtn = document.getElementById('buildNoticeClose');
    if(!notice || typeof BUILDING_NOW === 'undefined') return;

    const active = BUILDING_NOW.filter(p => p.active);
    if(!active.length) return; // nothing in development right now — stay silent

    const STORAGE_KEY = 'neuroforge-build-notice-dismissed-v1';
    let dismissed = false;
    try{ dismissed = localStorage.getItem(STORAGE_KEY) === '1'; }catch(e){}
    if(dismissed) return;

    const names = active.map(p => p.name);
    const joined = names.length > 1
      ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]
      : names[0];
    textEl.innerHTML = `<strong>${joined}</strong> ${names.length > 1 ? 'are' : 'is'} currently under active development. Live previews are up, but neither is a finished product yet.`;

    function dismiss(){
      notice.classList.remove('is-visible');
      try{ localStorage.setItem(STORAGE_KEY, '1'); }catch(e){}
    }
    closeBtn.addEventListener('click', dismiss);

    setTimeout(() => { notice.classList.add('is-visible'); }, 1400);
  })();

  /* ---------- CONTACT FORM ---------- */
  (function contactForm(){
    const form = document.getElementById('contactForm');
    if(!form) return;
    const status = document.getElementById('cf-status');
    const submitBtn = document.getElementById('cf-submit');
    const wrap = document.getElementById('contactFormWrap');
    const successPanel = document.getElementById('formSuccess');
    const resetBtn = document.getElementById('formSuccessReset');

    function showError(msg){
      status.textContent = msg;
      status.classList.add('is-error');
      submitBtn.classList.remove('is-shaking');
      requestAnimationFrame(() => submitBtn.classList.add('is-shaking'));
      setTimeout(() => submitBtn.classList.remove('is-shaking'), 500);
    }

    function resetLoadingState(){
      submitBtn.classList.remove('is-loading');
      submitBtn.removeAttribute('disabled');
    }

    form.addEventListener('submit', async function(e){
      e.preventDefault();

      const name = form.querySelector('#cf-name').value.trim();
      const email = form.querySelector('#cf-email').value.trim();
      const message = form.querySelector('#cf-message').value.trim();
      const honeypot = form.querySelector('[name="_honey"]').value;
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      status.classList.remove('is-error');

      if(honeypot){ return; } // silently drop bot submissions

      if(!name || !email || !message){
        showError('Please fill in your name, email, and message.');
        return;
      }
      if(!emailPattern.test(email)){
        showError('That email address doesn\'t look right — please check it.');
        return;
      }

      status.textContent = 'Sending…';
      submitBtn.classList.add('is-loading');
      submitBtn.setAttribute('disabled', 'true');

      try{
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });

        if(!res.ok) throw new Error('FormSubmit returned ' + res.status);

        // Swap to in-page success state — no redirect, no FormSubmit branded page.
        form.reset();
        resetLoadingState();
        status.textContent = '';
        status.classList.remove('is-error');
        wrap.querySelector('form').hidden = true;
        successPanel.hidden = false;
        successPanel.classList.add('is-in');
      }catch(err){
        resetLoadingState();
        showError('Something went wrong sending that — please try again, or email me directly.');
      }
    });

    if(resetBtn){
      resetBtn.addEventListener('click', () => {
        successPanel.hidden = true;
        successPanel.classList.remove('is-in');
        wrap.querySelector('form').hidden = false;
      });
    }
  })();

})();
