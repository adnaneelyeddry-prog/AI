/* =========================================================
   VARAILLY. — Main JavaScript
   Clean interactions, scroll reveals, cart, no 3D/parallax
   ========================================================= */

(function () {
    'use strict';

    // ---------- LOADING SCREEN ----------
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingBarFill = document.getElementById('loadingBarFill');

    let loadProgress = 0;
    const loadInterval = setInterval(function () {
        loadProgress += Math.random() * 25 + 10;
        if (loadProgress >= 100) {
            loadProgress = 100;
            clearInterval(loadInterval);
            if (loadingBarFill) loadingBarFill.style.width = '100%';
            setTimeout(function () {
                if (loadingScreen) loadingScreen.classList.add('hidden');
            }, 400);
        } else {
            if (loadingBarFill) loadingBarFill.style.width = loadProgress + '%';
        }
    }, 200);

    // Fallback: hide loading screen after 3s max
    setTimeout(function () {
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            if (loadingBarFill) loadingBarFill.style.width = '100%';
            setTimeout(function () {
                loadingScreen.classList.add('hidden');
            }, 300);
        }
    }, 3000);

    // ---------- HEADER HIDE/SHOW ON SCROLL ----------
    const header = document.getElementById('header');
    let lastScrollY = 0;
    let ticking = false;

    function updateHeader() {
        var currentScrollY = window.scrollY;
        if (header) {
            if (currentScrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(updateHeader);
            ticking = true;
        }
    });

    // ---------- MOBILE NAV TOGGLE ----------
    const mobileToggle = document.getElementById('mobileToggle');
    const headerNav = document.getElementById('headerNav');

    if (mobileToggle && headerNav) {
        mobileToggle.addEventListener('click', function () {
            mobileToggle.classList.toggle('active');
            headerNav.classList.toggle('active');
        });

        // Close nav on link click
        var navLinks = headerNav.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileToggle.classList.remove('active');
                headerNav.classList.remove('active');
            });
        });
    }

    // ---------- SCROLL REVEAL (IntersectionObserver) ----------
    function initScrollReveal() {
        var revealElements = document.querySelectorAll('.reveal, .product-card, .feature-card, .step-card, .category-tile, .testimonial-card, .lookbook-item, .stat-item, .insta-item, .section-header, .hero-content, .hero-image, .manifesto-inner, .video-wrapper, .faq-list, .cta-banner-inner');
        if (!revealElements.length) return;

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: '0px 0px -40px 0px',
            }
        );

        revealElements.forEach(function (el) {
            observer.observe(el);
        });
    }

    // Init after DOM loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollReveal);
    } else {
        initScrollReveal();
    }

    // ---------- ANIMATED COUNTERS ----------
    function animateCounters() {
        var statNumbers = document.querySelectorAll('.stat-number');
        if (!statNumbers.length) return;

        var observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        var el = entry.target;
                        var target = parseFloat(el.getAttribute('data-target')) || 0;
                        var decimals = parseInt(el.getAttribute('data-decimals')) || 0;
                        var suffix = el.getAttribute('data-suffix') || '';
                        var duration = 2000;
                        var startTime = null;

                        function step(timestamp) {
                            if (!startTime) startTime = timestamp;
                            var progress = Math.min((timestamp - startTime) / duration, 1);
                            var eased = 1 - Math.pow(1 - progress, 3);
                            var current = eased * target;

                            if (decimals > 0) {
                                el.textContent = current.toFixed(decimals) + suffix;
                            } else {
                                el.textContent =
                                    Math.floor(current).toLocaleString() + suffix;
                            }

                            if (progress < 1) {
                                requestAnimationFrame(step);
                            }
                        }

                        requestAnimationFrame(step);
                        observer.unobserve(el);
                    }
                });
            },
            { threshold: 0.5 }
        );

        statNumbers.forEach(function (el) {
            observer.observe(el);
        });
    }

    animateCounters();

    // ---------- VIDEO AUTO-PLAY WITH INTERSECTION OBSERVER ----------
    var videoBg = document.getElementById('videoBg');
    var videoPlayBtn = document.getElementById('videoPlayBtn');

    if (videoBg) {
        var videoObserver = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        videoBg.play().catch(function () {});
                    } else {
                        videoBg.pause();
                    }
                });
            },
            { threshold: 0.3 }
        );
        videoObserver.observe(videoBg);
    }

    if (videoPlayBtn && videoBg) {
        videoPlayBtn.addEventListener('click', function () {
            if (videoBg.paused) {
                videoBg.muted = false;
                videoBg.play().catch(function () {});
                videoPlayBtn.querySelector('span').textContent = 'Pause';
            } else {
                videoBg.pause();
                videoPlayBtn.querySelector('span').textContent = 'Watch Film';
            }
        });
    }

    // ---------- CART (persisted) ----------
    var CART_KEY = 'varailly_cart';
    var cart = [];
    try {
        var storedCart = localStorage.getItem(CART_KEY);
        if (storedCart) cart = JSON.parse(storedCart) || [];
    } catch (e) { cart = []; }

    function saveCart() {
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }
    window.saveCart = saveCart;

    // Free shipping progress
    var FREE_SHIP_THRESHOLD = 50;
    var shipProgress = document.getElementById('shipProgress');
    var shipProgressText = document.getElementById('shipProgressText');
    var shipProgressFill = document.getElementById('shipProgressFill');

    function updateShipProgress(subtotal) {
        if (!shipProgressFill || !shipProgressText) return;
        var pct = Math.min((subtotal / FREE_SHIP_THRESHOLD) * 100, 100);
        shipProgressFill.style.width = pct + '%';
        if (subtotal >= FREE_SHIP_THRESHOLD) {
            shipProgressText.innerHTML = '🎉 You unlocked <strong>free shipping!</strong>';
            if (shipProgress) shipProgress.classList.add('complete');
        } else {
            var remaining = (FREE_SHIP_THRESHOLD - subtotal).toFixed(2);
            shipProgressText.innerHTML = 'Add <strong>$' + remaining + '</strong> more for free shipping';
            if (shipProgress) shipProgress.classList.remove('complete');
        }
    }
    var cartBtn = document.getElementById('cartBtn');
    var cartCount = document.getElementById('cartCount');
    var cartOverlay = document.getElementById('cartOverlay');
    var cartDrawer = document.getElementById('cartDrawer');
    var cartClose = document.getElementById('cartClose');
    var cartBody = document.getElementById('cartBody');
    var cartEmpty = document.getElementById('cartEmpty');
    var cartFooter = document.getElementById('cartFooter');
    var cartSubtotal = document.getElementById('cartSubtotal');

    function openCart() {
        if (cartOverlay) cartOverlay.classList.add('active');
        if (cartDrawer) cartDrawer.classList.add('active');
    }

    function closeCart() {
        if (cartOverlay) cartOverlay.classList.remove('active');
        if (cartDrawer) cartDrawer.classList.remove('active');
    }

    function updateCartUI() {
        if (cartCount) cartCount.textContent = cart.length;

        if (!cartBody) return;

        // Clear existing rendered items
        cartBody.querySelectorAll('.cart-item').forEach(function (item) { item.remove(); });

        if (cart.length === 0) {
            if (cartEmpty) cartEmpty.style.display = 'block';
            if (cartFooter) cartFooter.style.display = 'none';
            updateShipProgress(0);
            return;
        }

        if (cartEmpty) cartEmpty.style.display = 'none';
        if (cartFooter) cartFooter.style.display = 'block';

        var subtotal = 0;
        cart.forEach(function (item, index) {
            subtotal += item.price;
            var div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML =
                (item.img ? '<img src="' + item.img + '" alt="" style="width:52px;height:64px;object-fit:cover;border-radius:8px;flex-shrink:0;">' : '') +
                '<div class="cart-item-info">' +
                '<div class="cart-item-name">' + item.name + '</div>' +
                '<div class="cart-item-price">$' + item.price.toFixed(2) + '</div>' +
                '</div>' +
                '<button class="cart-item-remove" data-index="' + index + '">Remove</button>';
            cartBody.appendChild(div);
        });

        if (cartSubtotal) cartSubtotal.textContent = '$' + subtotal.toFixed(2);
        updateShipProgress(subtotal);

        cartBody.querySelectorAll('.cart-item-remove').forEach(function (btn) {
            btn.addEventListener('click', function () {
                cart.splice(parseInt(btn.getAttribute('data-index')), 1);
                saveCart();
                updateCartUI();
            });
        });
    }

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Restore persisted cart on load
    updateCartUI();

    // ---------- QUICK VIEW MODAL ----------
    var quickAddButtons = document.querySelectorAll('.product-quick-add');
    var quickViewModal = document.getElementById('quickViewModal');
    var quickViewClose = document.getElementById('quickViewClose');
    var qvImage = document.getElementById('qvImage');
    var qvTitle = document.getElementById('qvTitle');
    var qvPrice = document.getElementById('qvPrice');
    var qvRating = document.getElementById('qvRating');
    var qvBadge = document.getElementById('qvBadge');
    var qvAddBtn = document.getElementById('qvAddBtn');
    var qvWishBtn = document.getElementById('qvWishBtn');
    var qtyValue = document.getElementById('qtyValue');
    var qtyMinus = document.getElementById('qtyMinus');
    var qtyPlus = document.getElementById('qtyPlus');
    var qvState = null;

    function openQuickView(card) {
        var btn = card.querySelector('.product-quick-add');
        if (!btn) return;
        var name = btn.getAttribute('data-product');
        var price = parseFloat(btn.getAttribute('data-price'));
        var img = card.querySelector('.product-image img');
        var ratingEl = card.querySelector('.product-rating');
        var badgeEl = card.querySelector('.product-badge');
        var cat = card.getAttribute('data-category') || '';

        qvState = { name: name, price: price, category: '', size: 'L', qty: 1, img: img ? img.src : '' };

        if (qvImage && img) { qvImage.src = img.src; qvImage.alt = name; }
        if (qvTitle) qvTitle.textContent = name;
        if (qvPrice) qvPrice.textContent = '$' + price.toFixed(2);
        if (qvRating && ratingEl) qvRating.innerHTML = ratingEl.innerHTML;
        if (qvBadge) {
            if (badgeEl) {
                qvBadge.textContent = badgeEl.textContent;
                qvBadge.className = badgeEl.className;
                qvBadge.style.display = 'block';
            } else {
                qvBadge.style.display = 'none';
            }
        }

        // Reset selections
        document.querySelectorAll('#qvCategories .qv-chip').forEach(function(c) { c.classList.remove('active'); });
        document.querySelectorAll('#qvSizes .qv-chip').forEach(function(s) {
            s.classList.toggle('active', s.getAttribute('data-size') === 'L');
        });
        if (qtyValue) qtyValue.textContent = '1';

        // Pre-select the product's own category if it maps cleanly
        var preset = { men: 'Men', women: 'Women', kids: 'Kids' }[cat];
        if (preset) {
            var presetChip = document.querySelector('#qvCategories .qv-chip[data-category="' + preset + '"]');
            if (presetChip) { presetChip.classList.add('active'); qvState.category = preset; }
        }

        // Wishlist state
        if (qvWishBtn) qvWishBtn.classList.toggle('active', isWished(name));

        if (quickViewModal) quickViewModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeQuickView() {
        if (quickViewModal) quickViewModal.classList.remove('active');
        document.body.style.overflow = '';
        qvState = null;
    }

    // Quick Add button opens Quick View
    quickAddButtons.forEach(function (btn) {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var card = btn.closest('.product-card');
            if (card) openQuickView(card);
        });
    });

    // Clicking the product image also opens Quick View
    document.querySelectorAll('.product-card .product-image img').forEach(function(img) {
        img.style.cursor = 'pointer';
        img.addEventListener('click', function() {
            var card = img.closest('.product-card');
            if (card) openQuickView(card);
        });
    });

    if (quickViewClose) quickViewClose.addEventListener('click', closeQuickView);
    if (quickViewModal) quickViewModal.addEventListener('click', function(e) {
        if (e.target === quickViewModal) closeQuickView();
    });

    // Category chips
    document.querySelectorAll('#qvCategories .qv-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            document.querySelectorAll('#qvCategories .qv-chip').forEach(function(c) { c.classList.remove('active'); });
            chip.classList.add('active');
            if (qvState) qvState.category = chip.getAttribute('data-category');
        });
    });

    // Size chips
    document.querySelectorAll('#qvSizes .qv-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            document.querySelectorAll('#qvSizes .qv-chip').forEach(function(c) { c.classList.remove('active'); });
            chip.classList.add('active');
            if (qvState) qvState.size = chip.getAttribute('data-size');
        });
    });

    // Quantity
    if (qtyMinus) qtyMinus.addEventListener('click', function() {
        if (!qvState || qvState.qty <= 1) return;
        qvState.qty--;
        if (qtyValue) qtyValue.textContent = qvState.qty;
    });
    if (qtyPlus) qtyPlus.addEventListener('click', function() {
        if (!qvState || qvState.qty >= 10) return;
        qvState.qty++;
        if (qtyValue) qtyValue.textContent = qvState.qty;
    });

    // Add to cart from Quick View
    if (qvAddBtn) {
        qvAddBtn.addEventListener('click', function() {
            if (!qvState) return;
            if (!qvState.category) {
                showToast('Please choose a category');
                return;
            }
            var label = qvState.name + ' (' + qvState.category + ', ' + qvState.size + ')';
            for (var i = 0; i < qvState.qty; i++) {
                cart.push({ name: label, price: qvState.price, img: qvState.img });
            }
            saveCart();
            updateCartUI();
            showToast(qvState.qty + '× ' + label + ' added!');
            closeQuickView();
            openCart();
        });
    }

    // Wishlist toggle from Quick View
    if (qvWishBtn) {
        qvWishBtn.addEventListener('click', function() {
            if (!qvState) return;
            toggleWish({ name: qvState.name, price: qvState.price, img: qvState.img });
            qvWishBtn.classList.toggle('active', isWished(qvState.name));
            syncProductHearts();
        });
    }

    // ---------- TOAST ----------
    var toast = document.getElementById('toast');
    var toastText = document.getElementById('toastText');
    var toastTimeout;

    function showToast(message) {
        if (!toast || !toastText) return;
        toastText.textContent = message;
        toast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function () {
            toast.classList.remove('show');
        }, 3000);
    }

    // ---------- NEWSLETTER FORM ----------
    var newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = newsletterForm.querySelector('.newsletter-input');
            if (input && input.value.trim()) {
                showToast('Thanks! You\'re on the list 🎉');
                input.value = '';
            }
        });
    }

    // ---------- LOOKBOOK DRAG SCROLL ----------
    var lookbookScroll = document.getElementById('lookbookScroll');
    if (lookbookScroll) {
        var isDown = false;
        var startX;
        var scrollLeft;

        lookbookScroll.addEventListener('mousedown', function (e) {
            isDown = true;
            lookbookScroll.style.cursor = 'grabbing';
            startX = e.pageX - lookbookScroll.offsetLeft;
            scrollLeft = lookbookScroll.scrollLeft;
        });

        lookbookScroll.addEventListener('mouseleave', function () {
            isDown = false;
            lookbookScroll.style.cursor = 'grab';
        });

        lookbookScroll.addEventListener('mouseup', function () {
            isDown = false;
            lookbookScroll.style.cursor = 'grab';
        });

        lookbookScroll.addEventListener('mousemove', function (e) {
            if (!isDown) return;
            e.preventDefault();
            var x = e.pageX - lookbookScroll.offsetLeft;
            var walk = (x - startX) * 1.5;
            lookbookScroll.scrollLeft = scrollLeft - walk;
        });
    }

    // ---------- SMOOTH ANCHOR SCROLLING ----------
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var href = anchor.getAttribute('href');
            if (href === '#') return;
            var target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // ---------- BACK TO TOP ----------
    var backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 800) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ---------- FAQ ACCORDION ----------
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
        var question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function () {
                var isActive = item.classList.contains('active');
                // Close all
                faqItems.forEach(function (i) {
                    i.classList.remove('active');
                });
                // Toggle current
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // ---------- COUNTDOWN TIMER (next Friday) ----------
    function getNextFriday() {
        var now = new Date();
        var day = now.getDay();
        var daysUntilFriday = (5 - day + 7) % 7;
        if (daysUntilFriday === 0) {
            daysUntilFriday = 7; // If today is Friday, next Friday
        }
        var nextFriday = new Date(now);
        nextFriday.setDate(now.getDate() + daysUntilFriday);
        nextFriday.setHours(12, 0, 0, 0);
        return nextFriday;
    }

    var countDays = document.getElementById('countDays');
    var countHours = document.getElementById('countHours');
    var countMins = document.getElementById('countMins');
    var countSecs = document.getElementById('countSecs');

    function updateCountdown() {
        var target = getNextFriday();
        var now = new Date();
        var diff = target - now;

        if (diff <= 0) {
            if (countDays) countDays.textContent = '00';
            if (countHours) countHours.textContent = '00';
            if (countMins) countMins.textContent = '00';
            if (countSecs) countSecs.textContent = '00';
            return;
        }

        var days = Math.floor(diff / (1000 * 60 * 60 * 24));
        var hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var secs = Math.floor((diff % (1000 * 60)) / 1000);

        if (countDays) countDays.textContent = String(days).padStart(2, '0');
        if (countHours) countHours.textContent = String(hours).padStart(2, '0');
        if (countMins) countMins.textContent = String(mins).padStart(2, '0');
        if (countSecs) countSecs.textContent = String(secs).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);

    // ---------- FLOATING AMAZON BUTTON ----------
    var floatingAmazon = document.getElementById('floatingAmazon');
    if (floatingAmazon) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 800) {
                floatingAmazon.classList.add('visible');
            } else {
                floatingAmazon.classList.remove('visible');
            }
        });
    }
})();



    // --- Category Video Play on Hover ---
    var categoryTiles = document.querySelectorAll('.category-tile');
    categoryTiles.forEach(function(tile) {
        var video = tile.querySelector('.category-video');
        if (!video) return;

        tile.addEventListener('mouseenter', function() {
            video.play().catch(function() {});
        });

        tile.addEventListener('mouseleave', function() {
            video.pause();
            video.currentTime = 0;
        });
    });



    // --- Product Category Filter ---
    var filterTabs = document.querySelectorAll('.filter-tab');
    var productCardsAll = document.querySelectorAll('.product-card[data-category]');

    var productsGridEl = document.querySelector('.products-grid');
    function filterProducts(category) {
        if (productsGridEl) productsGridEl.classList.add('filtering');
        productCardsAll.forEach(function(card) {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.classList.remove('hidden-filter');
            } else {
                card.classList.add('hidden-filter');
            }
        });
        setTimeout(function() {
            if (productsGridEl) productsGridEl.classList.remove('filtering');
        }, 500);
    }

    filterTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            filterTabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            filterProducts(tab.getAttribute('data-filter'));
        });
    });

    // Category tiles click → scroll to products + filter
    var categoryTilesNav = document.querySelectorAll('.category-tile[data-filter]');
    categoryTilesNav.forEach(function(tile) {
        tile.addEventListener('click', function(e) {
            e.preventDefault();
            var filter = tile.getAttribute('data-filter');
            // Activate the matching filter tab
            filterTabs.forEach(function(t) { t.classList.remove('active'); });
            var matchingTab = document.querySelector('.filter-tab[data-filter="' + filter + '"]');
            if (matchingTab) matchingTab.classList.add('active');
            // Filter products
            filterProducts(filter);
            // Scroll to products section
            var productsSection = document.getElementById('products');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });



    /* =========================================================
       WISHLIST (persisted)
       ========================================================= */
    var WISH_KEY = 'varailly_wishlist';
    var wishlist = [];

    try {
        var storedWish = localStorage.getItem(WISH_KEY);
        if (storedWish) wishlist = JSON.parse(storedWish) || [];
    } catch (e) { wishlist = []; }

    function saveWishlist() {
        try { localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)); } catch (e) {}
    }

    window.isWished = function (name) {
        return wishlist.some(function (w) { return w.name === name; });
    };

    window.toggleWish = function (item) {
        var idx = wishlist.findIndex(function (w) { return w.name === item.name; });
        if (idx > -1) {
            wishlist.splice(idx, 1);
            showToast('Removed from wishlist');
        } else {
            wishlist.push(item);
            showToast('Added to wishlist ♥');
        }
        saveWishlist();
        updateWishUI();
    };

    window.syncProductHearts = function () {
        document.querySelectorAll('.product-card').forEach(function (card) {
            var btn = card.querySelector('.product-wish');
            var addBtn = card.querySelector('.product-quick-add');
            if (!btn || !addBtn) return;
            btn.classList.toggle('active', window.isWished(addBtn.getAttribute('data-product')));
        });
    };

    var wishCountEl = document.getElementById('wishlistCount');
    var wishBody = document.getElementById('wishBody');
    var wishDrawer = document.getElementById('wishDrawer');
    var wishOverlay = document.getElementById('wishOverlay');
    var wishBtn = document.getElementById('wishlistBtn');
    var wishClose = document.getElementById('wishClose');

    function updateWishUI() {
        if (wishCountEl) wishCountEl.textContent = wishlist.length;
        if (!wishBody) return;

        if (wishlist.length === 0) {
            wishBody.innerHTML = '<p class="cart-empty">Your wishlist is empty.<br>Tap the heart on any product.</p>';
            return;
        }

        var html = '';
        wishlist.forEach(function (item, i) {
            html += '<div class="wish-item">' +
                (item.img ? '<img src="' + item.img + '" alt="">' : '') +
                '<div class="wish-item-info">' +
                    '<div class="wish-item-name">' + item.name + '</div>' +
                    '<div class="wish-item-price">$' + item.price.toFixed(2) + '</div>' +
                '</div>' +
                '<button class="wish-item-remove" data-wish="' + i + '">Remove</button>' +
            '</div>';
        });
        wishBody.innerHTML = html;

        wishBody.querySelectorAll('.wish-item-remove').forEach(function (b) {
            b.addEventListener('click', function () {
                wishlist.splice(parseInt(b.getAttribute('data-wish')), 1);
                saveWishlist();
                updateWishUI();
                window.syncProductHearts();
            });
        });
    }

    function openWish() {
        if (wishDrawer) wishDrawer.classList.add('active');
        if (wishOverlay) wishOverlay.classList.add('active');
    }
    function closeWish() {
        if (wishDrawer) wishDrawer.classList.remove('active');
        if (wishOverlay) wishOverlay.classList.remove('active');
    }
    if (wishBtn) wishBtn.addEventListener('click', openWish);
    if (wishClose) wishClose.addEventListener('click', closeWish);
    if (wishOverlay) wishOverlay.addEventListener('click', closeWish);

    // Product card heart buttons
    document.querySelectorAll('.product-card').forEach(function (card) {
        var heart = card.querySelector('.product-wish');
        var addBtn = card.querySelector('.product-quick-add');
        var img = card.querySelector('.product-image img');
        if (!heart || !addBtn) return;

        heart.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            window.toggleWish({
                name: addBtn.getAttribute('data-product'),
                price: parseFloat(addBtn.getAttribute('data-price')),
                img: img ? img.src : ''
            });
            window.syncProductHearts();
        });
    });

    updateWishUI();
    window.syncProductHearts();

    /* =========================================================
       SEARCH
       ========================================================= */
    var searchBtn = document.getElementById('searchBtn');
    var searchOverlay = document.getElementById('searchOverlay');
    var searchClose = document.getElementById('searchClose');
    var searchInput = document.getElementById('searchInput');
    var searchResults = document.getElementById('searchResults');

    // Build a searchable index from the DOM
    var searchIndex = [];
    document.querySelectorAll('.product-card').forEach(function (card) {
        var addBtn = card.querySelector('.product-quick-add');
        var img = card.querySelector('.product-image img');
        if (!addBtn) return;
        searchIndex.push({
            name: addBtn.getAttribute('data-product'),
            price: parseFloat(addBtn.getAttribute('data-price')),
            category: card.getAttribute('data-category') || '',
            img: img ? img.src : '',
            card: card
        });
    });

    function openSearch() {
        if (searchOverlay) searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        setTimeout(function () { if (searchInput) searchInput.focus(); }, 120);
    }
    function closeSearch() {
        if (searchOverlay) searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
        if (searchInput) searchInput.value = '';
        if (searchResults) searchResults.innerHTML = '<p class="search-hint">Start typing to search our collection</p>';
    }

    if (searchBtn) searchBtn.addEventListener('click', openSearch);
    if (searchClose) searchClose.addEventListener('click', closeSearch);
    if (searchOverlay) searchOverlay.addEventListener('click', function (e) {
        if (e.target === searchOverlay) closeSearch();
    });

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            var q = searchInput.value.trim().toLowerCase();
            if (!searchResults) return;

            if (!q) {
                searchResults.innerHTML = '<p class="search-hint">Start typing to search our collection</p>';
                return;
            }

            var matches = searchIndex.filter(function (p) {
                return p.name.toLowerCase().indexOf(q) > -1 || p.category.toLowerCase().indexOf(q) > -1;
            });

            if (matches.length === 0) {
                searchResults.innerHTML = '<p class="search-hint">No products found for "' + q + '"</p>';
                return;
            }

            var html = '';
            matches.forEach(function (p, i) {
                html += '<div class="search-result" data-result="' + i + '">' +
                    (p.img ? '<img src="' + p.img + '" alt="">' : '') +
                    '<div class="search-result-info">' +
                        '<div class="search-result-name">' + p.name + '</div>' +
                        '<div class="search-result-cat">' + (p.category || 'all') + '</div>' +
                    '</div>' +
                    '<div class="search-result-price">$' + p.price.toFixed(2) + '</div>' +
                '</div>';
            });
            searchResults.innerHTML = html;

            searchResults.querySelectorAll('.search-result').forEach(function (el) {
                el.addEventListener('click', function () {
                    var match = matches[parseInt(el.getAttribute('data-result'))];
                    closeSearch();
                    if (match && match.card) {
                        match.card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        match.card.style.outline = '3px solid var(--color-indigo)';
                        match.card.style.outlineOffset = '4px';
                        setTimeout(function () {
                            match.card.style.outline = '';
                            match.card.style.outlineOffset = '';
                        }, 2000);
                    }
                });
            });
        });
    }

    // Escape closes any open overlay
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        closeSearch();
        closeWish();
        if (typeof closeQuickView === 'function') closeQuickView();
    });
