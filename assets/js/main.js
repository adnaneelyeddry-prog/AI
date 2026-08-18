/* =========================================
   VARAILLY. — Main JavaScript
   Clean interactions, no particles/glitch
   ========================================= */

(function () {
    'use strict';

    // --- Loading Screen ---
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingBarFill = document.getElementById('loadingBarFill');

    if (loadingScreen && loadingBarFill) {
        let progress = 0;
        const interval = setInterval(function () {
            progress += Math.random() * 15 + 5;
            if (progress >= 100) {
                progress = 100;
                clearInterval(interval);
                setTimeout(function () {
                    loadingScreen.classList.add('hidden');
                    document.body.style.overflow = '';
                }, 300);
            }
            loadingBarFill.style.width = progress + '%';
        }, 100);

        document.body.style.overflow = 'hidden';
    }

    // --- Header Hide/Show on Scroll ---
    const header = document.getElementById('header');
    let lastScrollY = 0;
    let ticking = false;

    function updateHeader() {
        var scrollY = window.scrollY;
        if (header) {
            if (scrollY > lastScrollY && scrollY > 100) {
                header.classList.add('hidden');
            } else {
                header.classList.remove('hidden');
            }
        }
        lastScrollY = scrollY;
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    });

    // --- Mobile Navigation Toggle ---
    const mobileToggle = document.getElementById('mobileToggle');
    const headerNav = document.getElementById('headerNav');

    if (mobileToggle && headerNav) {
        mobileToggle.addEventListener('click', function () {
            mobileToggle.classList.toggle('active');
            headerNav.classList.toggle('active');
            document.body.style.overflow = headerNav.classList.contains('active') ? 'hidden' : '';
        });

        // Close nav on link click
        var navLinks = headerNav.querySelectorAll('.nav-link');
        navLinks.forEach(function (link) {
            link.addEventListener('click', function () {
                mobileToggle.classList.remove('active');
                headerNav.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }

    // --- Scroll Reveal (IntersectionObserver) ---
    var revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        var revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        // Fallback: show all immediately
        revealElements.forEach(function (el) {
            el.classList.add('revealed');
        });
    }

    // --- Animated Counters ---
    var statNumbers = document.querySelectorAll('.stat-number[data-target]');

    function animateCounter(el) {
        var target = parseFloat(el.getAttribute('data-target'));
        var decimals = parseInt(el.getAttribute('data-decimals')) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 2000;
        var start = 0;
        var startTime = null;

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            var progress = Math.min((timestamp - startTime) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
            var current = start + (target - start) * eased;

            if (decimals > 0) {
                el.textContent = current.toFixed(decimals) + suffix;
            } else {
                el.textContent = Math.floor(current).toLocaleString() + suffix;
            }

            if (progress < 1) {
                requestAnimationFrame(step);
            }
        }

        requestAnimationFrame(step);
    }

    if ('IntersectionObserver' in window && statNumbers.length > 0) {
        var counterObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    counterObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(function (el) {
            counterObserver.observe(el);
        });
    }

    // --- Video Play/Pause ---
    var videoBg = document.getElementById('videoBg');
    var videoPlayBtn = document.getElementById('videoPlayBtn');
    var videoPlaying = false;

    if (videoPlayBtn && videoBg) {
        videoPlayBtn.addEventListener('click', function () {
            if (videoPlaying) {
                videoBg.pause();
                videoPlayBtn.querySelector('span').textContent = 'Watch Film';
            } else {
                videoBg.play().then(function() {
                    videoPlayBtn.querySelector('span').textContent = 'Pause';
                }).catch(function() {
                    // If play fails, try with user gesture
                    videoBg.muted = true;
                    videoBg.play().then(function() {
                        videoPlayBtn.querySelector('span').textContent = 'Pause';
                    });
                });
            }
            videoPlaying = !videoPlaying;
        });

        // Auto-play when in view
        if ('IntersectionObserver' in window) {
            var videoObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting && !videoPlaying) {
                        videoBg.play().then(function() {
                            videoPlaying = true;
                            videoPlayBtn.querySelector('span').textContent = 'Pause';
                        }).catch(function () {
                            // Autoplay blocked, user needs to click
                        });
                    } else if (!entry.isIntersecting && videoPlaying) {
                        videoBg.pause();
                        videoPlaying = false;
                        videoPlayBtn.querySelector('span').textContent = 'Watch Film';
                    }
                });
            }, { threshold: 0.3 });

            videoObserver.observe(videoBg);
        }
    }

    // --- Cart (Simple Toast) ---
    var cartCount = document.getElementById('cartCount');
    var toast = document.getElementById('toast');
    var toastText = document.getElementById('toastText');
    var cartTotal = 0;
    var toastTimeout = null;

    function showToast(message) {
        if (!toast || !toastText) return;
        toastText.textContent = message;
        toast.classList.add('active');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function () {
            toast.classList.remove('active');
        }, 2500);
    }

    var quickAddButtons = document.querySelectorAll('.product-quick-add');
    quickAddButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            cartTotal++;
            if (cartCount) cartCount.textContent = cartTotal;
            var productName = btn.getAttribute('data-product');
            showToast(productName + ' added to cart!');
        });
    });

    // --- Newsletter Form ---
    var newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function (e) {
            e.preventDefault();
            var input = newsletterForm.querySelector('.newsletter-input');
            if (input && input.value) {
                showToast('Thanks! You\'re on the list.');
                input.value = '';
            }
        });
    }

    // --- Lookbook Drag Scroll ---
    var lookbookScroll = document.getElementById('lookbookScroll');

    if (lookbookScroll) {
        var isDown = false;
        var startX;
        var scrollLeft;

        lookbookScroll.addEventListener('mousedown', function (e) {
            isDown = true;
            startX = e.pageX - lookbookScroll.offsetLeft;
            scrollLeft = lookbookScroll.scrollLeft;
        });

        lookbookScroll.addEventListener('mouseleave', function () {
            isDown = false;
        });

        lookbookScroll.addEventListener('mouseup', function () {
            isDown = false;
        });

        lookbookScroll.addEventListener('mousemove', function (e) {
            if (!isDown) return;
            e.preventDefault();
            var x = e.pageX - lookbookScroll.offsetLeft;
            var walk = (x - startX) * 1.5;
            lookbookScroll.scrollLeft = scrollLeft - walk;
        });
    }

    // --- Smooth Scroll for Anchor Links ---
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var targetId = this.getAttribute('href');
            if (targetId === '#') return;
            var targetEl = document.querySelector(targetId);
            if (targetEl) {
                e.preventDefault();
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // --- Back to Top Button ---
    var backToTop = document.getElementById('backToTop');

    if (backToTop) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 600) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', function () {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

})();



    // --- Drop Countdown Timer ---
    var countDays = document.getElementById('countDays');
    var countHours = document.getElementById('countHours');
    var countMins = document.getElementById('countMins');
    var countSecs = document.getElementById('countSecs');

    if (countDays && countHours && countMins && countSecs) {
        // Next Friday at midnight
        function getNextFriday() {
            var now = new Date();
            var day = now.getDay();
            var diff = (5 - day + 7) % 7;
            if (diff === 0) diff = 7;
            var target = new Date(now);
            target.setDate(now.getDate() + diff);
            target.setHours(0, 0, 0, 0);
            return target;
        }

        var dropDate = getNextFriday();

        function updateCountdown() {
            var now = new Date().getTime();
            var diff = dropDate.getTime() - now;
            if (diff <= 0) {
                countDays.textContent = '00';
                countHours.textContent = '00';
                countMins.textContent = '00';
                countSecs.textContent = '00';
                return;
            }
            var d = Math.floor(diff / (1000 * 60 * 60 * 24));
            var h = Math.floor((diff / (1000 * 60 * 60)) % 24);
            var m = Math.floor((diff / (1000 * 60)) % 60);
            var s = Math.floor((diff / 1000) % 60);
            countDays.textContent = String(d).padStart(2, '0');
            countHours.textContent = String(h).padStart(2, '0');
            countMins.textContent = String(m).padStart(2, '0');
            countSecs.textContent = String(s).padStart(2, '0');
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }



    // --- FAQ Accordion ---
    var faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(function (item) {
        var question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', function () {
                var isActive = item.classList.contains('active');
                // Close all
                faqItems.forEach(function (i) { i.classList.remove('active'); });
                // Open clicked (if wasn't already open)
                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // --- Floating Amazon Button (show after scroll) ---
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
