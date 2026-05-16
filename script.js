/* =========================================================
   SMARTLOCK — interactions
   ========================================================= */
(function () {
  'use strict';
  const $  = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* low-power mode: mobile / touch devices — skip costly scroll effects */
  const lowPerf = reduce ||
    window.matchMedia('(max-width: 880px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;

  /* ---- build product render internals ---- */
  function buildProduct(el) {
    el.innerHTML =
      '<div class="pr-hole"></div>' +
      '<div class="pr-brand">SMARTLOCK</div>' +
      '<div class="pr-sensor"></div>';
  }
  $$('[data-product]').forEach(buildProduct);

  /* ---- preloader ---- */
  window.addEventListener('load', () => {
    const pl = $('#preloader');
    setTimeout(() => {
      pl.classList.add('is-done');
      document.body.classList.remove('is-locked');
    }, reduce ? 200 : 1100);
  });
  document.body.classList.add('is-locked');

  /* ---- scroll progress + nav state ---- */
  const nav = $('#nav');
  const progress = $('#scrollProgress');
  function onScroll() {
    const st = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (st / h) * 100 : 0) + '%';
    nav.classList.toggle('is-stuck', st > 30);
    updateFloatingCTAs(st);
  }

  /* ---- reveal on scroll ---- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });

  $$('.reveal').forEach((el, i) => {
    const group = el.parentElement;
    const sibs = $$('.reveal', group);
    if (sibs.length > 1) {
      const idx = sibs.indexOf(el) % 4;
      if (idx) el.setAttribute('data-d', idx);
    }
    io.observe(el);
  });

  /* ---- steps progress line ---- */
  const stepsSec = $('.steps');
  if (stepsSec) {
    const sp = $('#stepsProgress');
    const stepIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && sp) {
          sp.style.width = '100%';
          $$('.step').forEach((s, i) =>
            setTimeout(() => s.classList.add('in'), reduce ? 0 : i * 220));
          stepIO.disconnect();
        }
      });
    }, { threshold: 0.4 });
    stepIO.observe(stepsSec);
  }

  /* ---- parallax ---- */
  const parallaxEls = $$('[data-parallax]');
  let ticking = false;
  function parallax() {
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.1;
      const offset = (r.top + r.height / 2 - vh / 2) * -speed;
      el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
    });
    ticking = false;
  }
  function reqParallax() {
    if (!ticking && !lowPerf) { requestAnimationFrame(parallax); ticking = true; }
  }

  /* rAF-gated scroll handler — avoids running layout work on every event */
  let scrollScheduled = false;
  function onScrollRaf() {
    if (scrollScheduled) return;
    scrollScheduled = true;
    requestAnimationFrame(() => { onScroll(); reqParallax(); scrollScheduled = false; });
  }
  window.addEventListener('scroll', onScrollRaf, { passive: true });
  window.addEventListener('resize', onScrollRaf, { passive: true });
  onScroll(); reqParallax();

  /* ---- hero product subtle pointer tilt ---- */
  const heroProduct = $('#heroProduct');
  const heroStage = $('.hero__stage');
  if (heroProduct && heroStage && !lowPerf) {
    heroStage.addEventListener('pointermove', (ev) => {
      const r = heroStage.getBoundingClientRect();
      const dx = (ev.clientX - r.left - r.width / 2) / r.width;
      const dy = (ev.clientY - r.top - r.height / 2) / r.height;
      heroProduct.style.setProperty('--tilt',
        'perspective(900px) rotateY(' + (dx * 14).toFixed(2) +
        'deg) rotateX(' + (-dy * 12).toFixed(2) + 'deg)');
    });
    heroStage.addEventListener('pointerleave', () => {
      heroProduct.style.setProperty('--tilt', 'none');
    });
  }
  const tiltStyle = document.createElement('style');
  tiltStyle.textContent =
    '#heroProduct .product-render{transition:transform .25s var(--ease);' +
    'transform:var(--tilt,none)}';
  document.head.appendChild(tiltStyle);

  /* ---- floating CTAs visibility ---- */
  const buyCard = $('#buyCard');
  const stickyCta = $('#stickyCta');
  const heroEl = $('.hero');
  const finalEl = $('#buy');
  let heroH = heroEl ? heroEl.offsetHeight : 0;
  window.addEventListener('resize', () => {
    heroH = heroEl ? heroEl.offsetHeight : 0;
  }, { passive: true });
  function updateFloatingCTAs(st) {
    const finalTop = finalEl ? finalEl.getBoundingClientRect().top : 9999;
    const past = st > heroH * 0.7;
    const atFinal = finalTop < window.innerHeight * 0.7;
    const show = past && !atFinal;
    buyCard.classList.toggle('is-visible', show);
    buyCard.classList.toggle('is-hidden', !show);
    stickyCta.classList.toggle('is-visible', show);
  }

  /* ---- colour swatches ---- */
  const variants = { black: '', graphite: 'graphite', red: 'red' };
  $$('.swatch').forEach((sw) => {
    sw.addEventListener('click', () => {
      $$('.swatch').forEach((s) => s.classList.remove('is-active'));
      sw.classList.add('is-active');
      const v = variants[sw.getAttribute('data-swatch')] || '';
      const mini = $('.product-render--mini');
      if (mini) {
        if (v) mini.setAttribute('data-variant', v);
        else mini.removeAttribute('data-variant');
      }
    });
  });

  /* ---- buy buttons -> toast ---- */
  const toast = $('#toast');
  let toastTimer;
  $$('[data-buy]').forEach((b) => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      toast.classList.add('is-visible');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 3200);
    });
  });

  /* ---- smooth anchor + close other accordions ---- */
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id.length < 2) return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      const y = t.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  const accItems = $$('.acc__item');
  accItems.forEach((it) => {
    it.addEventListener('toggle', () => {
      if (it.open) accItems.forEach((o) => { if (o !== it) o.open = false; });
    });
  });
})();
