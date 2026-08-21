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
            if (currentScrollY > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            if (currentScrollY > lastScrollY && currentScrollY > 300) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
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
        var revealElements = document.querySelectorAll('.reveal');
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
                rootMargin: '0px 0px -50px 0px',
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

    // ---------- CART ----------
    var cart = [];
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

        if (cart.length === 0) {
            if (cartEmpty) cartEmpty.style.display = 'block';
            if (cartFooter) cartFooter.style.display = 'none';
            // Remove all cart items
            var existingItems = cartBody.querySelectorAll('.cart-item');
            existingItems.forEach(function (item) {
                item.remove();
            });
        } else {
            if (cartEmpty) cartEmpty.style.display = 'none';
            if (cartFooter) cartFooter.style.display = 'block';

            // Clear and rebuild
            var existingItems2 = cartBody.querySelectorAll('.cart-item');
            existingItems2.forEach(function (item) {
                item.remove();
            });

            var subtotal = 0;
            cart.forEach(function (item, index) {
                subtotal += item.price;
                var div = document.createElement('div');
                div.className = 'cart-item';
                div.innerHTML =
                    '<div class="cart-item-info">' +
                    '<div class="cart-item-name">' + item.name + '</div>' +
                    '<div class="cart-item-price">$' + item.price.toFixed(2) + '</div>' +
                    '</div>' +
                    '<button class="cart-item-remove" data-index="' + index + '">Remove</button>';
                cartBody.appendChild(div);
            });

            if (cartSubtotal) cartSubtotal.textContent = '$' + subtotal.toFixed(2);

            // Bind remove buttons
            var removeButtons = cartBody.querySelectorAll('.cart-item-remove');
            removeButtons.forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var idx = parseInt(btn.getAttribute('data-index'));
                    cart.splice(idx, 1);
                    updateCartUI();
                });
            });
        }
    }

    if (cartBtn) cartBtn.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    // Quick Add buttons
    var quickAddButtons = document.querySelectorAll('.product-quick-add');
    quickAddButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var name = btn.getAttribute('data-product');
            var price = parseFloat(btn.getAttribute('data-price'));
            cart.push({ name: name, price: price });
            updateCartUI();
            showToast(name + ' added to cart!');
        });
    });

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
