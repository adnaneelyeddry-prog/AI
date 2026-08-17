/* =========================================================
   VRNT — Premium Futuristic Store
   Interactions · Cursor · Parallax · Reveal · Loading
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  /* ---------------------------------------------------------
     LOADING SCREEN
  --------------------------------------------------------- */
  const loader = $('#loader');
  const loaderProgress = $('#loaderProgress');
  let loadProgress = 0;

  function advanceLoader() {
    loadProgress += Math.random() * 15 + 5;
    if (loadProgress > 95) loadProgress = 95;
    loaderProgress.style.width = loadProgress + '%';
  }

  const loadInterval = setInterval(advanceLoader, 200);

  window.addEventListener('load', () => {
    clearInterval(loadInterval);
    loaderProgress.style.width = '100%';
    setTimeout(() => {
      loader.classList.add('is-done');
      document.body.style.overflow = '';
    }, 600);
  });

  // Prevent scroll during loading
  document.body.style.overflow = 'hidden';

  /* ---------------------------------------------------------
     CUSTOM CURSOR
  --------------------------------------------------------- */
  const cursor = $('#cursor');
  const cursorDot = $('#cursorDot');
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;

  if (cursor && cursorDot && window.matchMedia('(hover: hover)').matches) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    // Smooth follow with lerp
    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.12;
      cursorY += (mouseY - cursorY) * 0.12;
      dotX += (mouseX - dotX) * 0.25;
      dotY += (mouseY - dotY) * 0.25;

      cursor.style.left = cursorX + 'px';
      cursor.style.top = cursorY + 'px';
      cursorDot.style.left = dotX + 'px';
      cursorDot.style.top = dotY + 'px';

      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover effect on interactive elements
    $$('[data-hover], a, button, .product-card, .category-tile, .lookbook__card').forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-hover'));
    });

    // Hide cursor when leaving window
    document.addEventListener('mouseleave', () => {
      cursor.classList.add('is-hidden');
      cursorDot.classList.add('is-hidden');
    });
    document.addEventListener('mouseenter', () => {
      cursor.classList.remove('is-hidden');
      cursorDot.classList.remove('is-hidden');
    });
  } else {
    // Remove cursor elements on touch devices
    if (cursor) cursor.remove();
    if (cursorDot) cursorDot.remove();
  }

  /* ---------------------------------------------------------
     MAGNETIC BUTTONS
  --------------------------------------------------------- */
  $$('.magnetic').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
    });
  });

  /* ---------------------------------------------------------
     PARALLAX ON MOUSE MOVE (Hero section)
  --------------------------------------------------------- */
  const heroVisual = $('.hero__visual');
  const hero = $('.hero');

  if (heroVisual && hero && window.matchMedia('(hover: hover)').matches) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      const mainImg = $('.hero__img-main');
      const float1 = $('.hero__img-float--1');
      const float2 = $('.hero__img-float--2');

      if (mainImg) mainImg.style.transform = `rotateY(${x * -8}deg) rotateX(${y * 5}deg) translateY(${y * -10}px)`;
      if (float1) float1.style.transform = `translate(${x * 20}px, ${y * 15}px) rotate(${x * 3}deg)`;
      if (float2) float2.style.transform = `translate(${x * -15}px, ${y * -20}px) rotate(${x * -2}deg)`;
    });

    hero.addEventListener('mouseleave', () => {
      const mainImg = $('.hero__img-main');
      const float1 = $('.hero__img-float--1');
      const float2 = $('.hero__img-float--2');
      if (mainImg) mainImg.style.transform = '';
      if (float1) float1.style.transform = '';
      if (float2) float2.style.transform = '';
    });
  }

  /* ---------------------------------------------------------
     HEADER: Hide on scroll down, show on scroll up
  --------------------------------------------------------- */
  const header = $('#siteHeader');
  let lastScrollY = 0;
  let headerTicking = false;

  function handleScroll() {
    const y = window.scrollY;
    if (y > lastScrollY && y > 150) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastScrollY = y;
    headerTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!headerTicking) {
      requestAnimationFrame(handleScroll);
      headerTicking = true;
    }
  }, { passive: true });

  /* ---------------------------------------------------------
     BACK TO TOP
  --------------------------------------------------------- */
  const backToTop = $('#backToTop');
  if (backToTop) {
    window.addEventListener('scroll', () => {
      backToTop.classList.toggle('is-visible', window.scrollY > 800);
    }, { passive: true });
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------------------------------------------------------
     SCROLL REVEAL (IntersectionObserver)
  --------------------------------------------------------- */
  const revealElements = $$('[data-reveal], [data-stagger]');

  if ('IntersectionObserver' in window && revealElements.length) {
    const revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    revealElements.forEach((el) => revealIO.observe(el));
  } else {
    revealElements.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------------------------------------
     ANIMATED COUNTERS
  --------------------------------------------------------- */
  const counters = $$('[data-count]');

  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimal || '0', 10);
    const divisor = decimals ? Math.pow(10, decimals) : 1;
    const displayTarget = target / divisor;
    const duration = 2000;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4); // ease-out-quart
      const current = displayTarget * eased;
      if (decimals) {
        el.textContent = current.toFixed(decimals);
      } else {
        el.textContent = Math.floor(current).toLocaleString();
      }
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = decimals ? displayTarget.toFixed(decimals) : displayTarget.toLocaleString();
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
    }, { threshold: 0.5 });
    counters.forEach((el) => counterIO.observe(el));
  }

  /* ---------------------------------------------------------
     CAMPAIGN FILM — Video play/pause
  --------------------------------------------------------- */
  const filmPlay = $('#filmPlay');
  const filmVideo = $('#filmVideo');
  const filmProgress = $('#filmProgress');
  const filmPlayLabel = $('#filmPlayLabel');
  let filmPlaying = false;

  if (filmPlay && filmVideo) {
    filmPlay.addEventListener('click', () => {
      filmPlaying = !filmPlaying;
      filmPlayLabel.textContent = filmPlaying ? 'Pause' : 'Play Film';

      if (filmPlaying) {
        filmVideo.play();
      } else {
        filmVideo.pause();
      }
    });

    filmVideo.addEventListener('timeupdate', () => {
      if (filmProgress && filmVideo.duration) {
        const pct = (filmVideo.currentTime / filmVideo.duration) * 100;
        filmProgress.style.width = pct + '%';
      }
    });

    // Auto-play on scroll into view
    if ('IntersectionObserver' in window) {
      const filmIO = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !filmPlaying) {
            filmVideo.play();
            filmPlaying = true;
            filmPlayLabel.textContent = 'Pause';
          } else if (!entry.isIntersecting && filmPlaying) {
            filmVideo.pause();
            filmPlaying = false;
            filmPlayLabel.textContent = 'Play Film';
          }
        });
      }, { threshold: 0.4 });
      filmIO.observe(filmVideo);
    }
  }

  /* ---------------------------------------------------------
     LOOKBOOK — Drag to scroll
  --------------------------------------------------------- */
  const lookbookTrack = $('#lookbookTrack');
  if (lookbookTrack) {
    let isDown = false;
    let startX;
    let scrollLeft;

    lookbookTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      lookbookTrack.style.cursor = 'grabbing';
      startX = e.pageX - lookbookTrack.offsetLeft;
      scrollLeft = lookbookTrack.scrollLeft;
    });
    lookbookTrack.addEventListener('mouseleave', () => {
      isDown = false;
      lookbookTrack.style.cursor = 'grab';
    });
    lookbookTrack.addEventListener('mouseup', () => {
      isDown = false;
      lookbookTrack.style.cursor = 'grab';
    });
    lookbookTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - lookbookTrack.offsetLeft;
      const walk = (x - startX) * 1.5;
      lookbookTrack.scrollLeft = scrollLeft - walk;
    });
  }

  /* ---------------------------------------------------------
     PRODUCT CARDS — 3D tilt on hover
  --------------------------------------------------------- */
  $$('.product-card').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-12px) scale(1.01) rotateY(${x * 6}deg) rotateX(${y * -4}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ---------------------------------------------------------
     CART (Simple state)
  --------------------------------------------------------- */
  const cart = [];
  const cartCountEl = $('#cartCount');
  const toast = $('#toast');
  let toastTimer = null;

  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
  }

  function updateCartCount() {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    if (cartCountEl) cartCountEl.textContent = total;
  }

  function addToCart(name, price) {
    const existing = cart.find((i) => i.name === name);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price: parseFloat(price), qty: 1 });
    }
    updateCartCount();
    showToast(`${name} added to cart ✓`);
  }

  // Wire up add buttons
  $$('[data-add]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const card = btn.closest('.product-card');
      if (card) {
        addToCart(card.dataset.name, card.dataset.price);
      }
    });
  });

  /* ---------------------------------------------------------
     NEWSLETTER
  --------------------------------------------------------- */
  const newsletterForm = $('#newsletterForm');
  const newsletterMsg = $('#newsletterMsg');
  const newsletterEmail = $('#newsletterEmail');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newsletterMsg.textContent = 'Please enter a valid email.';
        newsletterMsg.style.color = '#ec4899';
        return;
      }
      newsletterMsg.style.color = '';
      newsletterMsg.textContent = `Welcome to the crew! Check ${email} for 15% off. ✓`;
      newsletterForm.reset();
    });
  }

  /* ---------------------------------------------------------
     SMOOTH SCROLL for anchor links
  --------------------------------------------------------- */
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ---------------------------------------------------------
     SCROLL PROGRESS BAR
  --------------------------------------------------------- */
  const scrollProgress = document.getElementById('scrollProgress');
  if (scrollProgress) {
    window.addEventListener('scroll', () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = (window.scrollY / docHeight) * 100;
      scrollProgress.style.width = scrolled + '%';
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     PARALLAX ELEMENTS on scroll (subtle depth)
  --------------------------------------------------------- */
  const parallaxEls = $$('.glow-orb');
  let scrollTicking = false;

  function handleParallax() {
    const scrollY = window.scrollY;
    parallaxEls.forEach((el, i) => {
      const speed = (i + 1) * 0.03;
      el.style.transform = `translateY(${scrollY * speed}px)`;
    });
    scrollTicking = false;
  }

  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(handleParallax);
      scrollTicking = true;
    }
  }, { passive: true });

  /* ---------------------------------------------------------
     MOBILE NAV TOGGLE (simple)
  --------------------------------------------------------- */
  const navToggle = $('#navToggle');
  const mainNav = $('.main-nav');

  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.style.display === 'block';
      mainNav.style.display = isOpen ? '' : 'block';
      mainNav.style.position = isOpen ? '' : 'fixed';
      mainNav.style.top = isOpen ? '' : 'var(--header-h)';
      mainNav.style.left = isOpen ? '' : '0';
      mainNav.style.right = isOpen ? '' : '0';
      mainNav.style.background = isOpen ? '' : 'rgba(5,5,5,.95)';
      mainNav.style.backdropFilter = isOpen ? '' : 'blur(20px)';
      mainNav.style.padding = isOpen ? '' : '2rem';
      mainNav.style.zIndex = isOpen ? '' : '99';
      if (!isOpen) {
        const ul = $('ul', mainNav);
        if (ul) { ul.style.flexDirection = 'column'; ul.style.gap = '1.5rem'; }
      } else {
        const ul = $('ul', mainNav);
        if (ul) { ul.style.flexDirection = ''; ul.style.gap = ''; }
      }
    });
  }

})();
