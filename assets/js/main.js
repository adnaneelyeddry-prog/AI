/* =========================================================
   VARAILLY — Store interactions
   Single module: navigation, search, wishlist, quick view, cart.
   ========================================================= */
(function () {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const money = value => `$${Number(value).toFixed(2)}`;
  const STORAGE = { cart: 'varailly_cart', wishlist: 'varailly_wishlist' };
  const FREE_SHIPPING = 50;

  const safeArray = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };

  /* Loading */
  const loadingScreen = $('#loadingScreen');
  const loadingBar = $('#loadingBarFill');
  if (loadingScreen) {
    let progress = 0;
    const timer = setInterval(() => {
      progress = Math.min(94, progress + Math.random() * 18 + 8);
      if (loadingBar) loadingBar.style.width = `${progress}%`;
    }, 120);
    const finish = () => {
      clearInterval(timer);
      if (loadingBar) loadingBar.style.width = '100%';
      setTimeout(() => loadingScreen.classList.add('hidden'), 220);
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    setTimeout(finish, 2200);
  }

  /* Toast */
  const toast = $('#toast');
  const toastText = $('#toastText');
  let toastTimer;
  function showToast(message) {
    if (!toast || !toastText) return;
    toastText.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  /* Overlay/body-lock coordinator */
  const overlayElements = [$('#searchOverlay'), $('#quickViewModal'), $('#cartDrawer'), $('#wishDrawer')].filter(Boolean);
  function syncBodyLock() {
    const dialogOpen = overlayElements.some(el => el.classList.contains('active'));
    const menuOpen = Boolean(headerNav?.classList.contains('active'));
    document.body.style.overflow = dialogOpen || menuOpen ? 'hidden' : '';
  }
  function setDialogState(element, isOpen) {
    if (!element) return;
    element.classList.toggle('active', isOpen);
    element.setAttribute('aria-hidden', String(!isOpen));
    syncBodyLock();
  }

  /* Header and mobile navigation */
  const header = $('#header');
  const mobileToggle = $('#mobileToggle');
  const headerNav = $('#headerNav');
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeMobileNav() {
    if (!headerNav || !mobileToggle) return;
    headerNav.classList.remove('active');
    mobileToggle.classList.remove('active');
    mobileToggle.setAttribute('aria-expanded', 'false');
    mobileToggle.setAttribute('aria-label', 'Open menu');
    syncBodyLock();
  }
  mobileToggle?.addEventListener('click', () => {
    const open = !headerNav.classList.contains('active');
    headerNav.classList.toggle('active', open);
    mobileToggle.classList.toggle('active', open);
    mobileToggle.setAttribute('aria-expanded', String(open));
    mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    syncBodyLock();
  });
  $$('.nav-link', headerNav || document).forEach(link => link.addEventListener('click', closeMobileNav));

  /* Scroll reveal with no-JS and reduced-motion resilience */
  const revealTargets = $$('.reveal');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -28px' });
    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('revealed'));
  }

  /* Product catalog derived from cards */
  const productCards = $$('.product-card');
  const catalog = productCards.map(card => {
    const action = $('.product-quick-add', card);
    const image = $('.product-image img', card);
    return {
      card,
      name: action?.dataset.product || $('.product-name', card)?.textContent.trim() || 'VARAILLY tee',
      price: Number(action?.dataset.price || 0),
      category: card.dataset.category || 'all',
      image: image?.src || '',
      ratingHTML: $('.product-rating', card)?.innerHTML || '★★★★★ <span>(New)</span>',
      badge: $('.product-badge', card)
    };
  });
  catalog.forEach(product => {
    const image = $('.product-image img', product.card);
    if (image && !image.alt) image.alt = `${product.name} product photo`;
  });

  /* Cart */
  let cart = safeArray(STORAGE.cart).filter(item => item && typeof item.name === 'string' && Number.isFinite(Number(item.price)));
  const cartBtn = $('#cartBtn');
  const cartCount = $('#cartCount');
  const cartOverlay = $('#cartOverlay');
  const cartDrawer = $('#cartDrawer');
  const cartClose = $('#cartClose');
  const cartBody = $('#cartBody');
  const cartEmpty = $('#cartEmpty');
  const cartFooter = $('#cartFooter');
  const cartSubtotal = $('#cartSubtotal');
  const shipProgress = $('#shipProgress');
  const shipProgressText = $('#shipProgressText');
  const shipProgressFill = $('#shipProgressFill');

  function cartSubtotalValue() {
    return cart.reduce((total, item) => total + Number(item.price || 0), 0);
  }
  function updateShipping(total) {
    if (!shipProgress || !shipProgressText || !shipProgressFill) return;
    const percent = Math.min(100, (total / FREE_SHIPPING) * 100);
    shipProgressFill.style.width = `${percent}%`;
    const complete = total >= FREE_SHIPPING;
    shipProgress.classList.toggle('complete', complete);
    shipProgressText.textContent = complete
      ? 'Free shipping unlocked.'
      : `Add ${money(FREE_SHIPPING - total)} more for free shipping`;
  }
  function renderCart() {
    if (cartCount) cartCount.textContent = String(cart.length);
    if (!cartBody) return;
    $$('.cart-item', cartBody).forEach(row => row.remove());

    const empty = cart.length === 0;
    if (cartEmpty) cartEmpty.style.display = empty ? 'block' : 'none';
    if (cartFooter) cartFooter.style.display = empty ? 'none' : 'block';

    cart.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      if (item.img) {
        const image = document.createElement('img');
        image.src = item.img;
        image.alt = '';
        image.width = 52;
        image.height = 64;
        image.style.cssText = 'width:52px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0';
        row.appendChild(image);
      }
      const info = document.createElement('div');
      info.className = 'cart-item-info';
      const name = document.createElement('div');
      name.className = 'cart-item-name';
      name.textContent = item.name;
      const price = document.createElement('div');
      price.className = 'cart-item-price';
      price.textContent = money(item.price);
      info.append(name, price);
      const remove = document.createElement('button');
      remove.className = 'cart-item-remove';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${item.name}`);
      remove.addEventListener('click', () => {
        cart.splice(index, 1);
        save(STORAGE.cart, cart);
        renderCart();
      });
      row.append(info, remove);
      cartBody.appendChild(row);
    });

    const total = cartSubtotalValue();
    if (cartSubtotal) cartSubtotal.textContent = money(total);
    updateShipping(total);
  }
  let cartOpener = null;
  function openCart() {
    cartOpener = document.activeElement;
    setDialogState(wishDrawer, false);
    wishOverlay?.classList.remove('active');
    setDialogState(cartDrawer, true);
    cartOverlay?.classList.add('active');
    cartClose?.focus();
  }
  function closeCart() {
    const wasOpen = Boolean(cartDrawer?.classList.contains('active'));
    setDialogState(cartDrawer, false);
    cartOverlay?.classList.remove('active');
    if (wasOpen && cartOpener instanceof HTMLElement) cartOpener.focus();
    cartOpener = null;
  }
  cartBtn?.addEventListener('click', openCart);
  cartClose?.addEventListener('click', closeCart);
  cartOverlay?.addEventListener('click', closeCart);
  renderCart();

  /* Wishlist */
  let wishlist = safeArray(STORAGE.wishlist).filter(item => item && typeof item.name === 'string');
  const wishlistBtn = $('#wishlistBtn');
  const wishlistCount = $('#wishlistCount');
  const wishDrawer = $('#wishDrawer');
  const wishOverlay = $('#wishOverlay');
  const wishClose = $('#wishClose');
  const wishBody = $('#wishBody');

  const isWished = name => wishlist.some(item => item.name === name);
  function syncHearts() {
    catalog.forEach(product => $('.product-wish', product.card)?.classList.toggle('active', isWished(product.name)));
  }
  function renderWishlist() {
    if (wishlistCount) wishlistCount.textContent = String(wishlist.length);
    if (!wishBody) return;
    wishBody.replaceChildren();
    if (!wishlist.length) {
      const empty = document.createElement('p');
      empty.className = 'cart-empty';
      empty.innerHTML = 'Your wishlist is empty.<br>Tap the heart on any product.';
      wishBody.appendChild(empty);
      syncHearts();
      return;
    }
    wishlist.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'wish-item';
      if (item.img) {
        const image = document.createElement('img');
        image.src = item.img;
        image.alt = '';
        row.appendChild(image);
      }
      const info = document.createElement('div');
      info.className = 'wish-item-info';
      const name = document.createElement('div');
      name.className = 'wish-item-name';
      name.textContent = item.name;
      const price = document.createElement('div');
      price.className = 'wish-item-price';
      price.textContent = money(item.price);
      info.append(name, price);
      const remove = document.createElement('button');
      remove.className = 'wish-item-remove';
      remove.textContent = 'Remove';
      remove.addEventListener('click', () => {
        wishlist.splice(index, 1);
        save(STORAGE.wishlist, wishlist);
        renderWishlist();
      });
      row.append(info, remove);
      wishBody.appendChild(row);
    });
    syncHearts();
  }
  function toggleWishlist(product) {
    const index = wishlist.findIndex(item => item.name === product.name);
    if (index >= 0) {
      wishlist.splice(index, 1);
      showToast('Removed from wishlist');
    } else {
      wishlist.push({ name: product.name, price: product.price, img: product.image });
      showToast('Saved to wishlist');
    }
    save(STORAGE.wishlist, wishlist);
    renderWishlist();
  }
  let wishlistOpener = null;
  function openWishlist() {
    wishlistOpener = document.activeElement;
    closeCart();
    setDialogState(wishDrawer, true);
    wishOverlay?.classList.add('active');
    wishClose?.focus();
  }
  function closeWishlist() {
    const wasOpen = Boolean(wishDrawer?.classList.contains('active'));
    setDialogState(wishDrawer, false);
    wishOverlay?.classList.remove('active');
    if (wasOpen && wishlistOpener instanceof HTMLElement) wishlistOpener.focus();
    wishlistOpener = null;
  }
  wishlistBtn?.addEventListener('click', openWishlist);
  wishClose?.addEventListener('click', closeWishlist);
  wishOverlay?.addEventListener('click', closeWishlist);
  catalog.forEach(product => $('.product-wish', product.card)?.addEventListener('click', event => {
    event.stopPropagation();
    toggleWishlist(product);
  }));
  renderWishlist();

  /* Quick view */
  const quickView = $('#quickViewModal');
  const quickViewClose = $('#quickViewClose');
  const qvImage = $('#qvImage');
  const qvTitle = $('#qvTitle');
  const qvPrice = $('#qvPrice');
  const qvRating = $('#qvRating');
  const qvBadge = $('#qvBadge');
  const qvAdd = $('#qvAddBtn');
  const qvWish = $('#qvWishBtn');
  const qtyMinus = $('#qtyMinus');
  const qtyPlus = $('#qtyPlus');
  const qtyValue = $('#qtyValue');
  let selectedProduct = null;
  let selectedCategory = '';
  let selectedSize = 'L';
  let selectedQuantity = 1;

  let quickViewOpener = null;
  function openQuickView(product) {
    quickViewOpener = document.activeElement;
    selectedProduct = product;
    selectedCategory = ({ men: 'Men', women: 'Women', kids: 'Kids' })[product.category] || '';
    selectedSize = 'L';
    selectedQuantity = 1;
    if (qvImage) { qvImage.src = product.image; qvImage.alt = product.name; }
    if (qvTitle) qvTitle.textContent = product.name;
    if (qvPrice) qvPrice.textContent = money(product.price);
    if (qvRating) qvRating.innerHTML = product.ratingHTML;
    if (qvBadge) {
      qvBadge.style.display = product.badge ? 'block' : 'none';
      if (product.badge) {
        qvBadge.textContent = product.badge.textContent;
        qvBadge.className = product.badge.className;
      }
    }
    $$('#qvCategories .qv-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.category === selectedCategory));
    $$('#qvSizes .qv-chip').forEach(chip => chip.classList.toggle('active', chip.dataset.size === selectedSize));
    if (qtyValue) qtyValue.textContent = '1';
    qvWish?.classList.toggle('active', isWished(product.name));
    setDialogState(quickView, true);
    quickViewClose?.focus();
  }
  function closeQuickView() {
    const wasOpen = Boolean(quickView?.classList.contains('active'));
    setDialogState(quickView, false);
    selectedProduct = null;
    if (wasOpen && quickViewOpener instanceof HTMLElement) quickViewOpener.focus();
    quickViewOpener = null;
  }
  catalog.forEach(product => {
    $('.product-quick-add', product.card)?.addEventListener('click', event => { event.stopPropagation(); openQuickView(product); });
    $('.product-image img', product.card)?.addEventListener('click', () => openQuickView(product));
  });
  quickViewClose?.addEventListener('click', closeQuickView);
  quickView?.addEventListener('click', event => { if (event.target === quickView) closeQuickView(); });
  $$('#qvCategories .qv-chip').forEach(chip => chip.addEventListener('click', () => {
    selectedCategory = chip.dataset.category;
    $$('#qvCategories .qv-chip').forEach(item => item.classList.toggle('active', item === chip));
  }));
  $$('#qvSizes .qv-chip').forEach(chip => chip.addEventListener('click', () => {
    selectedSize = chip.dataset.size;
    $$('#qvSizes .qv-chip').forEach(item => item.classList.toggle('active', item === chip));
  }));
  qtyMinus?.addEventListener('click', () => { selectedQuantity = Math.max(1, selectedQuantity - 1); if (qtyValue) qtyValue.textContent = String(selectedQuantity); });
  qtyPlus?.addEventListener('click', () => { selectedQuantity = Math.min(10, selectedQuantity + 1); if (qtyValue) qtyValue.textContent = String(selectedQuantity); });
  qvWish?.addEventListener('click', () => {
    if (!selectedProduct) return;
    toggleWishlist(selectedProduct);
    qvWish.classList.toggle('active', isWished(selectedProduct.name));
  });
  qvAdd?.addEventListener('click', () => {
    if (!selectedProduct) return;
    if (!selectedCategory) { showToast('Choose a category first'); return; }
    const label = `${selectedProduct.name} (${selectedCategory}, ${selectedSize})`;
    for (let i = 0; i < selectedQuantity; i++) cart.push({ name: label, price: selectedProduct.price, img: selectedProduct.image });
    save(STORAGE.cart, cart);
    renderCart();
    showToast(`${selectedQuantity} × ${selectedProduct.name} added`);
    closeQuickView();
    openCart();
  });

  /* Search */
  const searchBtn = $('#searchBtn');
  const searchOverlay = $('#searchOverlay');
  const searchClose = $('#searchClose');
  const searchInput = $('#searchInput');
  const searchResults = $('#searchResults');
  let searchOpener = null;
  function resetSearch() {
    if (!searchResults) return;
    searchResults.replaceChildren();
    const hint = document.createElement('p');
    hint.className = 'search-hint';
    hint.textContent = 'Start typing to search our collection';
    searchResults.appendChild(hint);
  }
  function closeSearch() {
    const wasOpen = Boolean(searchOverlay?.classList.contains('active'));
    setDialogState(searchOverlay, false);
    if (searchInput) searchInput.value = '';
    resetSearch();
    if (wasOpen && searchOpener instanceof HTMLElement) searchOpener.focus();
    searchOpener = null;
  }
  searchBtn?.addEventListener('click', () => {
    searchOpener = document.activeElement;
    setDialogState(searchOverlay, true);
    setTimeout(() => searchInput?.focus(), 80);
  });
  searchClose?.addEventListener('click', closeSearch);
  searchOverlay?.addEventListener('click', event => { if (event.target === searchOverlay) closeSearch(); });
  searchInput?.addEventListener('input', () => {
    const query = searchInput.value.trim().toLowerCase();
    if (!query) { resetSearch(); return; }
    const matches = catalog.filter(product => product.name.toLowerCase().includes(query) || product.category.includes(query));
    searchResults.replaceChildren();
    if (!matches.length) {
      const empty = document.createElement('p');
      empty.className = 'search-hint';
      empty.textContent = `No products found for “${searchInput.value.trim()}”`;
      searchResults.appendChild(empty);
      return;
    }
    matches.forEach(product => {
      const row = document.createElement('div');
      row.className = 'search-result';
      row.tabIndex = 0;
      const image = document.createElement('img');
      image.src = product.image;
      image.alt = '';
      const info = document.createElement('div');
      info.className = 'search-result-info';
      const name = document.createElement('div');
      name.className = 'search-result-name';
      name.textContent = product.name;
      const category = document.createElement('div');
      category.className = 'search-result-cat';
      category.textContent = product.category;
      const price = document.createElement('div');
      price.className = 'search-result-price';
      price.textContent = money(product.price);
      info.append(name, category);
      row.append(image, info, price);
      const choose = () => { closeSearch(); openQuickView(product); };
      row.addEventListener('click', choose);
      row.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') choose(); });
      searchResults.appendChild(row);
    });
  });

  /* Product filters */
  const filterTabs = $$('.filter-tab');
  const productGrid = $('.products-grid');
  function filterProducts(filter) {
    productGrid?.classList.add('filtering');
    catalog.forEach(product => product.card.classList.toggle('hidden-filter', filter !== 'all' && product.category !== filter));
    setTimeout(() => productGrid?.classList.remove('filtering'), 480);
  }
  function selectFilter(filter) {
    filterTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.filter === filter));
    filterProducts(filter);
  }
  filterTabs.forEach(tab => tab.addEventListener('click', () => selectFilter(tab.dataset.filter)));
  $$('.category-tile[data-filter]').forEach(tile => tile.addEventListener('click', event => {
    event.preventDefault();
    selectFilter(tile.dataset.filter);
    $('#products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  /* Category hover videos: fallback image stays unless playback succeeds */
  $$('.category-tile').forEach(tile => {
    const video = $('.category-video', tile);
    if (!video) return;
    video.addEventListener('canplay', () => tile.classList.add('video-ready'), { once: true });
    video.addEventListener('error', () => tile.classList.remove('video-ready'));
    tile.addEventListener('mouseenter', () => video.play().then(() => tile.classList.add('video-ready')).catch(() => tile.classList.remove('video-ready')));
    tile.addEventListener('mouseleave', () => { video.pause(); video.currentTime = 0; });
    tile.addEventListener('focusin', () => video.play().then(() => tile.classList.add('video-ready')).catch(() => tile.classList.remove('video-ready')));
    tile.addEventListener('focusout', () => { video.pause(); video.currentTime = 0; });
  });

  /* Campaign video */
  const campaignVideo = $('#videoBg');
  const campaignButton = $('#videoPlayBtn');
  function syncVideoLabel() {
    const label = $('span', campaignButton || document);
    if (label) label.textContent = campaignVideo && !campaignVideo.paused ? 'Pause film' : 'Watch film';
  }
  campaignButton?.addEventListener('click', () => {
    if (!campaignVideo) return;
    if (campaignVideo.paused) {
      campaignVideo.muted = false;
      campaignVideo.play()
        .catch(() => { campaignVideo.muted = true; return campaignVideo.play(); })
        .catch(() => campaignVideo.pause())
        .finally(syncVideoLabel);
    } else {
      campaignVideo.pause();
      syncVideoLabel();
    }
  });
  campaignVideo?.addEventListener('play', syncVideoLabel);
  campaignVideo?.addEventListener('pause', syncVideoLabel);
  if (campaignVideo && 'IntersectionObserver' in window) {
    const videoObserver = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) { campaignVideo.pause(); return; }
      if (campaignVideo.muted) campaignVideo.play().catch(() => {});
    }, { threshold: .25 });
    videoObserver.observe(campaignVideo);
  }

  /* Lookbook drag */
  const lookbook = $('#lookbookScroll');
  if (lookbook) {
    let dragging = false, startX = 0, initialScroll = 0;
    lookbook.addEventListener('pointerdown', event => { dragging = true; startX = event.clientX; initialScroll = lookbook.scrollLeft; lookbook.setPointerCapture(event.pointerId); });
    lookbook.addEventListener('pointermove', event => { if (dragging) lookbook.scrollLeft = initialScroll - (event.clientX - startX) * 1.35; });
    lookbook.addEventListener('pointerup', () => { dragging = false; });
    lookbook.addEventListener('pointercancel', () => { dragging = false; });
  }

  /* FAQ */
  $$('.faq-item').forEach((item, index) => {
    const question = $('.faq-question', item);
    const answer = $('.faq-answer', item);
    if (!question || !answer) return;
    const answerId = `faq-answer-${index + 1}`;
    answer.id = answerId;
    question.setAttribute('aria-controls', answerId);
    question.setAttribute('aria-expanded', 'false');
    question.addEventListener('click', () => {
      const opening = !item.classList.contains('active');
      $$('.faq-item').forEach(other => {
        other.classList.remove('active');
        $('.faq-question', other)?.setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('active', opening);
      question.setAttribute('aria-expanded', String(opening));
    });
  });

  /* Countdown to this Friday at noon, or next Friday after it passes */
  const countEls = { days: $('#countDays'), hours: $('#countHours'), minutes: $('#countMins'), seconds: $('#countSecs') };
  function nextDrop() {
    const now = new Date();
    const target = new Date(now);
    let days = (5 - now.getDay() + 7) % 7;
    target.setDate(now.getDate() + days);
    target.setHours(12, 0, 0, 0);
    if (target <= now) target.setDate(target.getDate() + 7);
    return target;
  }
  let dropDate = nextDrop();
  function updateCountdown() {
    let difference = dropDate - new Date();
    if (difference <= 0) { dropDate = nextDrop(); difference = dropDate - new Date(); }
    const pad = value => String(value).padStart(2, '0');
    if (countEls.days) countEls.days.textContent = pad(Math.floor(difference / 86400000));
    if (countEls.hours) countEls.hours.textContent = pad(Math.floor(difference / 3600000) % 24);
    if (countEls.minutes) countEls.minutes.textContent = pad(Math.floor(difference / 60000) % 60);
    if (countEls.seconds) countEls.seconds.textContent = pad(Math.floor(difference / 1000) % 60);
  }
  if (Object.values(countEls).some(Boolean)) { updateCountdown(); setInterval(updateCountdown, 1000); }

  /* Animated counters */
  const counters = $$('.stat-number[data-target]');
  function animateCounter(element) {
    const target = Number(element.dataset.target || 0);
    const decimals = Number(element.dataset.decimals || 0);
    const suffix = element.dataset.suffix || '';
    const start = performance.now();
    const frame = now => {
      const progress = Math.min(1, (now - start) / 1500);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      element.textContent = `${decimals ? value.toFixed(decimals) : Math.floor(value).toLocaleString()}${suffix}`;
      if (progress < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }), { threshold: .4 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else counters.forEach(animateCounter);

  /* Newsletter */
  $('#newsletterForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = $('.newsletter-input', event.currentTarget);
    if (!input || !input.checkValidity()) { input?.reportValidity(); return; }
    showToast('Welcome to the next drop.');
    event.currentTarget.reset();
  });

  /* Smooth anchors; placeholders no longer jump to page top */
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const href = link.getAttribute('href');
    if (href === '#') { event.preventDefault(); return; }
    const target = $(href);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  /* Floating actions */
  const backToTop = $('#backToTop');
  const floatingAmazon = $('#floatingAmazon');
  const syncFloatingActions = () => {
    const visible = window.scrollY > 700;
    backToTop?.classList.toggle('visible', visible);
    floatingAmazon?.classList.toggle('visible', visible);
  };
  window.addEventListener('scroll', syncFloatingActions, { passive: true });
  syncFloatingActions();
  backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* Image and video failure resilience */
  $$('img').forEach(image => {
    const markFailed = () => image.classList.add('media-failed');
    image.addEventListener('error', markFailed);
    if (image.complete && image.naturalWidth === 0 && image.src) markFailed();
  });

  /* Escape closes every layer */
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    closeMobileNav();
    closeSearch();
    closeQuickView();
    closeCart();
    closeWishlist();
  });
})();
