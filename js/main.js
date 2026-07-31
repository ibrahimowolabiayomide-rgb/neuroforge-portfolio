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

  /* ---------- HERO CANVAS: forge particle field ---------- */
  (function heroCanvas(){
    const canvas = document.getElementById('heroCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h, dpr = Math.min(window.devicePixelRatio || 1, 2);
    let particles = [];
    let mouseX = 0.5, mouseY = 0.5;

    function resize(){
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }

    function initParticles(){
      particles = [];
      const isNarrow = w < 640;
      const count = reduceMotion ? 0 : (isNarrow ? 45 : 90);
      const sizeScale = isNarrow ? 0.55 : 1;
      for(let i=0;i<count;i++){
        particles.push({
          x: Math.random()*w,
          y: Math.random()*h,
          r: (Math.random()*1.6 + 0.4) * sizeScale,
          vx: (Math.random()-0.5)*0.15,
          vy: (Math.random()-0.5)*0.15,
          hue: Math.random() < 0.55 ? 'amber' : 'cyan',
          o: Math.random()*0.5 + 0.2
        });
      }
    }

    function getColor(name, alpha){
      return name === 'amber'
        ? `rgba(255,107,53,${alpha})`
        : `rgba(94,234,212,${alpha})`;
    }

    function draw(){
      ctx.clearRect(0,0,w,h);
      const dx = (mouseX - 0.5) * 18;
      const dy = (mouseY - 0.5) * 18;

      for(const p of particles){
        p.x += p.vx;
        p.y += p.vy;
        if(p.x < -10) p.x = w+10;
        if(p.x > w+10) p.x = -10;
        if(p.y < -10) p.y = h+10;
        if(p.y > h+10) p.y = -10;

        const px = p.x + dx * (p.r);
        const py = p.y + dy * (p.r);

        ctx.beginPath();
        ctx.arc(px, py, p.r * 1.8, 0, Math.PI*2);
        ctx.fillStyle = getColor(p.hue, p.o);
        ctx.fill();
      }
      if(!reduceMotion) requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => { resize(); initParticles(); }, { passive: true });
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    }, { passive: true });

    resize();
    initParticles();
    if(!reduceMotion) draw();
    else draw();
  })();

  /* ---------- HERO MOUSE-FOLLOW GLOW ---------- */
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
   NEUROFORGE — PART 2: counters, skills, projects,
   testimonials, contact form, scroll reveal
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

  /* ---------- ANIMATED COUNTERS ---------- */
  (function counters(){
    const counters = document.querySelectorAll('.js-counter');
    if(!counters.length) return;

    function animateCount(el){
      const target = parseInt(el.getAttribute('data-target'), 10) || 0;
      if(reduceMotion){ el.textContent = target; return; }
      const duration = 1400;
      const start = performance.now();
      function step(now){
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if(progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }

    if('IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            animateCount(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });
      counters.forEach(c => io.observe(c));
    } else {
      counters.forEach(animateCount);
    }
  })();

  /* ---------- SKILLS: build panels from data, tab switching, animate bars ---------- */
  (function skills(){
    const panelsWrap = document.getElementById('skillPanels');
    const tabs = document.querySelectorAll('.skill-tab');
    if(!panelsWrap || typeof SKILLS === 'undefined') return;

    Object.keys(SKILLS).forEach(cat => {
      const panel = panelsWrap.querySelector(`.skill-panel[data-cat="${cat}"]`);
      if(!panel) return;
      panel.innerHTML = SKILLS[cat].map(skill => `
        <div class="skill-bar-row">
          <div class="skill-bar-name">${skill.icon}<span>${skill.name}</span></div>
          <div class="skill-bar-track"><div class="skill-bar-fill" data-pct="${skill.pct}"></div></div>
          <div class="skill-bar-pct">${skill.pct}%</div>
        </div>
      `).join('');
    });

    function animateBars(panel){
      panel.querySelectorAll('.skill-bar-fill').forEach(fill => {
        const pct = fill.getAttribute('data-pct');
        requestAnimationFrame(() => { fill.style.width = pct + '%'; });
      });
    }

    // animate the initially-active panel when it scrolls into view
    const activePanel = panelsWrap.querySelector('.skill-panel.is-active');
    if(activePanel && 'IntersectionObserver' in window){
      const io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if(entry.isIntersecting){
            animateBars(entry.target);
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      io.observe(activePanel);
    } else if(activePanel){
      animateBars(activePanel);
    }

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
      if(target){
        target.classList.add('is-active');
        animateBars(target);
      }
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

    function webpSrc(imgPath){
      return imgPath.replace(/\.(jpe?g|png)$/i, '.webp');
    }

    function statusBadgeHTML(p){
      if(p.placeholder) return `<span class="project-card-placeholder-badge">Placeholder</span>`;
      if(p.live) return `<span class="project-card-live"><span class="dot"></span>Live</span>`;
      return `<span class="project-card-soon"><span class="dot"></span>Coming Soon</span>`;
    }

    function cardHTML(p, i){
      return `
        <article class="project-card${p.placeholder ? ' is-placeholder' : ''}" data-cats="${p.cats.join(' ')}" data-id="${p.id}" tabindex="0" role="button" aria-label="View details for ${p.title}">
          <div class="project-card-top">
            ${statusBadgeHTML(p)}
          </div>
          <div class="project-thumb">
            <picture>
              <source srcset="${webpSrc(p.img)}" type="image/webp">
              <img src="${p.img}" alt="${p.title} project screenshot" loading="lazy" width="640" height="400">
            </picture>
          </div>
          <h3 class="project-card-title">${p.title}</h3>
          <p class="project-card-desc">${p.short}</p>
          <div class="project-card-foot">
            <div class="tag-row">${p.tags.slice(0,3).map(t => `<span class="pill">${t}</span>`).join('')}</div>
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
      modalImg.src = project.img;
      modalImg.alt = project.title + ' project screenshot';
      modalYear.textContent = project.placeholder ? 'Placeholder — Slot Open' : (project.live ? 'Live' : 'Coming Soon');
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

  /* ---------- TESTIMONIAL CAROUSEL ---------- */
  (function testimonials(){
    const track = document.getElementById('testiTrack');
    if(!track) return;
    const carousel = document.querySelector('.testi-carousel') || track.parentElement;
    const slides = track.querySelectorAll('.testi-slide');
    const dotsWrap = document.getElementById('testiDots');
    const prevBtn = document.getElementById('testiPrev');
    const nextBtn = document.getElementById('testiNext');
    let current = 0;
    let autoTimer;
    let isPaused = false;

    const liveStatus = document.createElement('div');
    liveStatus.className = 'visually-hidden';
    liveStatus.setAttribute('aria-live', 'polite');
    carousel.appendChild(liveStatus);

    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.className = 'testi-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i+1));
      dot.addEventListener('click', () => { goTo(i); restart(); });
      dotsWrap.appendChild(dot);
    });

    function goTo(i, announce){
      current = (i + slides.length) % slides.length;
      track.style.transform = `translateX(-${current * 100}%)`;
      dotsWrap.querySelectorAll('.testi-dot').forEach((d, idx) => d.classList.toggle('is-active', idx === current));
      if(announce) liveStatus.textContent = `Testimonial ${current + 1} of ${slides.length}`;
    }
    function next(){ goTo(current + 1, true); }
    function prev(){ goTo(current - 1, true); }
    function restart(){
      clearInterval(autoTimer);
      if(!reduceMotion && !isPaused) autoTimer = setInterval(next, 6000);
    }

    prevBtn.addEventListener('click', () => { prev(); restart(); });
    nextBtn.addEventListener('click', () => { next(); restart(); });

    /* Pause auto-advance on hover or keyboard focus so it never fights the reader (WCAG 2.2.2) */
    carousel.addEventListener('mouseenter', () => { isPaused = true; clearInterval(autoTimer); });
    carousel.addEventListener('mouseleave', () => { isPaused = false; restart(); });
    carousel.addEventListener('focusin', () => { isPaused = true; clearInterval(autoTimer); });
    carousel.addEventListener('focusout', (e) => {
      if(!carousel.contains(e.relatedTarget)){ isPaused = false; restart(); }
    });

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if(Math.abs(diff) > 40){ diff > 0 ? next() : prev(); restart(); }
    }, { passive: true });

    restart();
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
