/* =========================================================
   VRNT — Modern Streetwear Store
   Front-end interactivity (vanilla JS, no dependencies)
   ========================================================= */
(function () {
  'use strict';

  /* ---------------------------------------------------------
     Utilities
  --------------------------------------------------------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const fmtMoney = (n) => '$' + n.toFixed(2).replace(/\.00$/, '');

  /* ---------------------------------------------------------
     Footer year
  --------------------------------------------------------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------------------------------------------------
     Mobile nav drawer
  --------------------------------------------------------- */
  const navToggle = $('#navToggle');
  const mobileNav = $('#mobileNav');
  const scrim = $('#scrim');

  function openMobileNav() {
    mobileNav.classList.add('is-open');
    scrim.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMobileNav() {
    mobileNav.classList.remove('is-open');
    scrim.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.contains('is-open');
      isOpen ? closeMobileNav() : openMobileNav();
    });
  }
  if (scrim) scrim.addEventListener('click', closeMobileNav);
  $$('.mobile-nav a').forEach((a) => a.addEventListener('click', closeMobileNav));

  /* ---------------------------------------------------------
     Search panel
  --------------------------------------------------------- */
  const searchToggle = $('#searchToggle');
  const searchPanel = $('#searchPanel');
  const searchClose = $('#searchClose');

  if (searchToggle && searchPanel) {
    searchToggle.addEventListener('click', () => {
      searchPanel.classList.toggle('is-open');
      if (searchPanel.classList.contains('is-open')) {
        const input = $('input', searchPanel);
        if (input) setTimeout(() => input.focus(), 150);
      }
    });
  }
  if (searchClose) {
    searchClose.addEventListener('click', () => searchPanel.classList.remove('is-open'));
  }

  /* ---------------------------------------------------------
     Sticky header: condense + hide on scroll down, show on scroll up
  --------------------------------------------------------- */
  const header = $('#siteHeader');
  let lastScrollY = window.scrollY;
  let ticking = false;

  function handleHeaderScroll() {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 10);
    header.classList.toggle('is-condensed', y > 120);

    if (y > lastScrollY && y > 200) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastScrollY = y;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(handleHeaderScroll);
      ticking = true;
    }
  }, { passive: true });

  /* ---------------------------------------------------------
     Back to top button
  --------------------------------------------------------- */
  const backToTop = $('#backToTop');
  window.addEventListener('scroll', () => {
    if (!backToTop) return;
    backToTop.classList.toggle('is-visible', window.scrollY > 600);
  }, { passive: true });
  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     Scroll reveal via IntersectionObserver
  --------------------------------------------------------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------
     Animated stat counters
  --------------------------------------------------------- */
  const counters = $$('[data-count]');
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const divisor = decimals ? Math.pow(10, decimals) : 1;
    const displayTarget = target / divisor;
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      const current = displayTarget * eased;
      el.textContent = decimals
        ? current.toFixed(decimals)
        : Math.floor(current).toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
      else {
        el.textContent = decimals
          ? displayTarget.toFixed(decimals)
          : displayTarget.toLocaleString();
      }
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window && counters.length) {
    const counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => counterIO.observe(el));
  }

  /* ---------------------------------------------------------
     Drop countdown timer
  --------------------------------------------------------- */
  const countdownEl = $('#countdown');
  if (countdownEl) {
    // Target: next Friday 00:00 local time (weekly drop cadence)
    function getNextFriday() {
      const now = new Date();
      const target = new Date(now);
      const day = now.getDay(); // 0 = Sun ... 5 = Fri
      let diff = (5 - day + 7) % 7;
      if (diff === 0 && now.getHours() >= 0 && now >= new Date(now.setHours(0,0,0,0))) {
        // if it's already Friday, target next Friday instead of today
      }
      target.setDate(now.getDate() + (diff === 0 ? 7 : diff));
      target.setHours(0, 0, 0, 0);
      return target;
    }

    const dropDate = getNextFriday();
    const cdD = $('#cd-d'), cdH = $('#cd-h'), cdM = $('#cd-m'), cdS = $('#cd-s');

    function pad(n) { return String(n).padStart(2, '0'); }

    function updateCountdown() {
      const now = new Date().getTime();
      const diff = dropDate.getTime() - now;
      if (diff <= 0) {
        cdD.textContent = cdH.textContent = cdM.textContent = cdS.textContent = '00';
        return;
      }
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      cdD.textContent = pad(d);
      cdH.textContent = pad(h);
      cdM.textContent = pad(m);
      cdS.textContent = pad(s);
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  /* ---------------------------------------------------------
     Product card swatches — swap tee color live
  --------------------------------------------------------- */
  $$('.product-card').forEach((card) => {
    const swatches = $$('.swatch', card);
    const teeVisual = $('.tee-visual', card);
    swatches.forEach((sw) => {
      sw.addEventListener('click', () => {
        swatches.forEach((s) => s.classList.remove('active'));
        sw.classList.add('active');
        if (teeVisual) teeVisual.style.setProperty('--tee-color', sw.dataset.color);
      });
    });
  });

  /* ---------------------------------------------------------
     Toast helper
  --------------------------------------------------------- */
  const toast = $('#toast');
  let toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  /* ---------------------------------------------------------
     Cart state
  --------------------------------------------------------- */
  const cart = [];
  const cartDrawer = $('#cartDrawer');
  const cartScrim = $('#cartScrim');
  const cartToggle = $('#cartToggle');
  const cartClose = $('#cartClose');
  const cartItemsEl = $('#cartItems');
  const cartEmptyEl = $('#cartEmpty');
  const cartSubtotalEl = $('#cartSubtotal');
  const cartCountEl = $('#cartCount');

  function openCart() {
    cartDrawer.classList.add('is-open');
    cartScrim.classList.add('is-open');
    cartDrawer.setAttribute('aria-hidden', 'false');
  }
  function closeCart() {
    cartDrawer.classList.remove('is-open');
    cartScrim.classList.remove('is-open');
    cartDrawer.setAttribute('aria-hidden', 'true');
  }
  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (cartScrim) cartScrim.addEventListener('click', closeCart);

  function addToCart(item) {
    // merge identical variant (name + color + size)
    const existing = cart.find(
      (c) => c.name === item.name && c.color === item.color && c.size === item.size
    );
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push(Object.assign({ qty: 1 }, item));
    }
    renderCart();
    bumpCartCount();
    showToast(`${item.name} added to cart`);
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
  }

  function bumpCartCount() {
    if (!cartCountEl) return;
    cartCountEl.classList.remove('bump');
    // restart animation
    void cartCountEl.offsetWidth;
    cartCountEl.classList.add('bump');
  }

  function renderCart() {
    const totalQty = cart.reduce((sum, c) => sum + c.qty, 0);
    if (cartCountEl) cartCountEl.textContent = totalQty;

    if (!cart.length) {
      cartItemsEl.innerHTML = '';
      cartItemsEl.appendChild(cartEmptyEl);
      cartSubtotalEl.textContent = fmtMoney(0);
      return;
    }

    cartItemsEl.innerHTML = '';
    let subtotal = 0;

    cart.forEach((item, index) => {
      subtotal += item.price * item.qty;

      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item__thumb">
          <div class="tee-visual" style="--tee-color:${item.color}">
            <svg class="tee-shape"><use href="#icon-tee"/></svg>
          </div>
        </div>
        <div class="cart-item__info">
          <h5>${item.name}</h5>
          <span>Size ${item.size} · Qty ${item.qty}</span>
        </div>
        <div class="cart-item__price">${fmtMoney(item.price * item.qty)}</div>
        <button class="icon-btn cart-item__remove" aria-label="Remove ${item.name}">
          <svg class="icon"><use href="#icon-trash"/></svg>
        </button>
      `;
      $('.cart-item__remove', row).addEventListener('click', () => removeFromCart(index));
      cartItemsEl.appendChild(row);
    });

    cartSubtotalEl.textContent = fmtMoney(subtotal);
  }

  // Wire "Add" buttons on product grid
  $$('.product-card').forEach((card) => {
    const addBtn = $('[data-add]', card);
    if (!addBtn) return;
    addBtn.addEventListener('click', () => {
      const activeSwatch = $('.swatch.active', card);
      addToCart({
        name: card.dataset.name,
        price: parseFloat(card.dataset.price),
        color: activeSwatch ? activeSwatch.dataset.color : '#0a0a0a',
        size: 'M'
      });
    });
  });

  renderCart(); // initial empty state

  /* ---------------------------------------------------------
     Variant Lab
  --------------------------------------------------------- */
  const labPreview = $('#labPreview');
  const labColors = $('#labColors');
  const labGraphics = $('#labGraphics');
  const labSizes = $('#labSizes');
  const labAdd = $('#labAdd');

  let labState = { color: '#d6ff3d', graphic: 'stripes', size: 'M' };

  function updateLabPreview() {
    if (!labPreview) return;
    labPreview.style.setProperty('--tee-color', labState.color);
    $$('.tee-graphic', labPreview).forEach((g) => {
      g.hidden = g.dataset.graphic !== labState.graphic;
    });
  }

  if (labColors) {
    $$('.swatch', labColors).forEach((sw) => {
      sw.addEventListener('click', () => {
        $$('.swatch', labColors).forEach((s) => s.classList.remove('active'));
        sw.classList.add('active');
        labState.color = sw.dataset.color;
        updateLabPreview();
      });
    });
  }

  if (labGraphics) {
    $$('.chip', labGraphics).forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('.chip', labGraphics).forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        labState.graphic = chip.dataset.graphic;
        updateLabPreview();
      });
    });
  }

  if (labSizes) {
    $$('.chip', labSizes).forEach((chip) => {
      chip.addEventListener('click', () => {
        $$('.chip', labSizes).forEach((c) => c.classList.remove('active'));
        chip.classList.add('active');
        labState.size = chip.dataset.size;
      });
    });
  }

  if (labAdd) {
    labAdd.addEventListener('click', () => {
      const graphicNames = { stripes: 'Prism', dots: 'Static', bolt: 'Bolt', none: 'Blank' };
      addToCart({
        name: `Custom ${graphicNames[labState.graphic] || ''} Variant`.trim(),
        price: 42,
        color: labState.color,
        size: labState.size
      });
    });
  }

  updateLabPreview();

  /* ---------------------------------------------------------
     Campaign "film" — animated ambient loop with play/pause
     (CSS-driven ambient motion; button toggles a simulated
     progress timeline so it behaves like a real video player)
  --------------------------------------------------------- */
  const filmPlay = $('#filmPlay');
  const filmPanel = $('#filmPanel');
  const filmProgress = $('#filmProgress');
  const filmPlayLabel = $('#filmPlayLabel');
  let filmPlaying = false;
  let filmRAF = null;
  let filmStart = 0;
  let filmElapsed = 0;
  const FILM_DURATION = 16000; // ms, matches ambient loop pacing

  function filmTick(now) {
    if (!filmStart) filmStart = now;
    const elapsed = filmElapsed + (now - filmStart);
    const pct = (elapsed % FILM_DURATION) / FILM_DURATION * 100;
    if (filmProgress) filmProgress.style.width = pct + '%';
    filmRAF = requestAnimationFrame(filmTick);
  }

  if (filmPlay) {
    filmPlay.addEventListener('click', () => {
      filmPlaying = !filmPlaying;
      filmPlay.setAttribute('aria-pressed', String(filmPlaying));
      filmPlayLabel.textContent = filmPlaying ? 'Playing…' : 'Play film';
      filmPanel.style.animationPlayState = filmPlaying ? 'running' : 'paused';
      $$('.film__layer', filmPanel).forEach((layer) => {
        layer.style.animationPlayState = filmPlaying ? 'running' : 'paused';
      });

      if (filmPlaying) {
        filmStart = 0;
        filmRAF = requestAnimationFrame(filmTick);
      } else {
        filmElapsed += performance.now() - (filmStart || performance.now());
        cancelAnimationFrame(filmRAF);
      }
    });
  }

  /* ---------------------------------------------------------
     Bestsellers carousel — prev/next scroll controls
  --------------------------------------------------------- */
  const carousel = $('#carousel');
  const carPrev = $('#carPrev');
  const carNext = $('#carNext');

  function scrollCarousel(dir) {
    if (!carousel) return;
    const card = $('.carousel__card', carousel);
    const step = card ? card.getBoundingClientRect().width + 22 : 260;
    carousel.scrollBy({ left: dir * step, behavior: 'smooth' });
  }
  if (carPrev) carPrev.addEventListener('click', () => scrollCarousel(-1));
  if (carNext) carNext.addEventListener('click', () => scrollCarousel(1));

  /* ---------------------------------------------------------
     Newsletter form
  --------------------------------------------------------- */
  const newsletterForm = $('#newsletterForm');
  const newsletterMsg = $('#newsletterMsg');
  const newsletterEmail = $('#newsletterEmail');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!isValid) {
        newsletterMsg.textContent = 'Enter a valid email to join the crew.';
        newsletterMsg.style.color = '#ff3d6e';
        return;
      }
      newsletterMsg.style.color = '';
      newsletterMsg.textContent = `You're in! Check ${email} for your 15% code.`;
      newsletterForm.reset();
    });
  }

  /* ---------------------------------------------------------
     Close any open overlay with Escape key
  --------------------------------------------------------- */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (mobileNav && mobileNav.classList.contains('is-open')) closeMobileNav();
    if (cartDrawer && cartDrawer.classList.contains('is-open')) closeCart();
    if (searchPanel && searchPanel.classList.contains('is-open')) searchPanel.classList.remove('is-open');
  });

})();
