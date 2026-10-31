/**
 * Main Portfolio Interactions
 * Ethan McClarence Gacud Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  initLoader();
  initCustomCursor();
  initTypingEffect();
  initShootingStars();
  initScrollReveal();
  initCoffeeNavModal();
  initDownloadCv();
  initProjectScrollers();
  initCarousel();
  initSkillsDrawer();
  initAdminShortcut();
  initFooter();
  initExpandableSkills();
  initProjectModals();
  initCertificateModals();
});

/* ============================================================
   1. LOADING SCREEN
   ============================================================ */
function initLoader() {
  const loader = document.getElementById('loader');
  const loaderPercentage = document.getElementById('loaderPercentage');

  if (loader && loaderPercentage) {
    let count = 0;
    const interval = setInterval(() => {
      count += Math.floor(Math.random() * 8) + 4;
      if (count > 100) count = 100;
      loaderPercentage.textContent = count;

      if (count === 100) {
        clearInterval(interval);
        setTimeout(() => {
          loader.classList.add('hidden');
          document.body.classList.add('site-loaded');
        }, 300);
      }
    }, 20);
  } else {
    document.body.classList.add('site-loaded');
  }
}

/* ============================================================
   2. CUSTOM MAGNETIC CURSOR
   ============================================================ */
function initCustomCursor() {
  const cursor = document.getElementById('customCursor');
  if (!cursor) return;

  // Touch devices check
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    cursor.style.display = 'none';
    return;
  }

  document.addEventListener('mousemove', (e) => {
    cursor.style.left = `${e.clientX}px`;
    cursor.style.top = `${e.clientY}px`;
  }, { passive: true });

  const attachHoverListeners = () => {
    const interactables = document.querySelectorAll('a, button, input, textarea, select, .skill-card, .project-card');
    interactables.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('hovering'));
    });
  };

  attachHoverListeners();

  // Re-attach for dynamically injected elements
  const observer = new MutationObserver(() => attachHoverListeners());
  observer.observe(document.body, { childList: true, subtree: true });
}

/* ============================================================
   3. DYNAMIC TYPING EFFECT (Hero Section)
   ============================================================ */
function initTypingEffect() {
  const typedTextSpan = document.getElementById('typedText');
  if (!typedTextSpan) return;

  const phrases = [
    'frontend craft — HTML, CSS, JavaScript',
    'fast, responsive web interfaces',
    'clean code & structured logic',
    'backend endpoints with PHP & MySQL'
  ];

  let phraseIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  const typeSpeed = 80;
  const deleteSpeed = 45;
  const pauseDuration = 2200;

  function typeLoop() {
    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      charIndex--;
      typedTextSpan.textContent = currentPhrase.substring(0, charIndex);
    } else {
      charIndex++;
      typedTextSpan.textContent = currentPhrase.substring(0, charIndex);
    }

    let delay = isDeleting ? deleteSpeed : typeSpeed;

    if (!isDeleting && charIndex === currentPhrase.length) {
      delay = pauseDuration;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      delay = 400;
    }

    setTimeout(typeLoop, delay);
  }

  typedTextSpan.textContent = '';
  setTimeout(typeLoop, 800);
}

/* ============================================================
   4. SHOOTING STARS CANVAS (Hero)
   ============================================================ */
function initShootingStars() {
  const canvas = document.getElementById('shootingStars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const rand = (min, max) => min + Math.random() * (max - min);

  function createStar() {
    const angle = rand(-30, -60) * (Math.PI / 180);
    const speed = rand(6, 12);
    return {
      x: rand(-100, canvas.width + 100),
      y: rand(-50, canvas.height * 0.6),
      vx: Math.cos(angle) * speed,
      vy: Math.abs(Math.sin(angle) * speed) * 0.5,
      length: rand(70, 160),
      alpha: rand(0.15, 0.45),
      width: rand(1, 2.2),
      delay: rand(0, 150),
    };
  }

  const stars = Array.from({ length: 14 }, createStar);

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const s of stars) {
      if (s.delay > 0) {
        s.delay--;
        continue;
      }

      s.x += s.vx;
      s.y += s.vy;

      const mag = Math.hypot(s.vx, s.vy);
      const tx = s.x - (s.vx / mag) * s.length;
      const ty = s.y - (s.vy / mag) * s.length;

      const grad = ctx.createLinearGradient(tx, ty, s.x, s.y);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.6, `rgba(108,99,255,${s.alpha * 0.4})`);
      grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);

      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(s.x, s.y);
      ctx.strokeStyle = grad;
      ctx.lineWidth = s.width;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.width * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.alpha})`;
      ctx.fill();

      if (s.x > canvas.width + 200 || s.y > canvas.height + 100) {
        Object.assign(s, createStar());
        s.x = rand(-50, canvas.width * 0.5);
        s.y = rand(-50, canvas.height * 0.3);
        s.delay = rand(0, 100);
      }
    }

    requestAnimationFrame(animate);
  }

  animate();
}

/* ============================================================
   5. SCROLL REVEAL (IntersectionObserver)
   ============================================================ */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  reveals.forEach((el) => observer.observe(el));
}

/* ============================================================
   6. BUY ME A COFFEE (Global Navbar Button + Responsive Modal)
   ============================================================ */
function initCoffeeNavModal() {
  const navCoffeeBtn = document.getElementById('coffeeNavBtn');
  const legacyCoffeeBtn = document.getElementById('buyMeCoffeeBtn');

  // Helper to ensure modal exists in DOM
  function ensureCoffeeModal() {
    let modal = document.getElementById('coffeeModal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.className = 'coffee-modal-overlay';
    modal.id = 'coffeeModal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'coffeeModalTitle');
    modal.setAttribute('aria-hidden', 'true');

    modal.innerHTML = `
      <div class="coffee-modal-card" role="document">
        <button type="button" class="coffee-modal-close" id="coffeeModalClose" aria-label="Close support modal">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div class="coffee-modal-header">
          <div class="coffee-modal-icon">
            <i class="fa-solid fa-mug-hot"></i>
          </div>
          <h3 class="coffee-modal-title" id="coffeeModalTitle">Buy Me a Coffee</h3>
          <p class="coffee-modal-subtitle">A little support goes a long way.</p>
        </div>

        <div class="coffee-modal-body">
          <p>Enjoying my portfolio or projects? If you'd like, you can support my learning journey and future projects with a voluntary contribution.</p>
          <p>There's absolutely no obligation. Visiting my portfolio and checking out my work is already appreciated!</p>

          <div class="coffee-modal-payment">
            <div class="coffee-payment-method">
              <span>Available payment method:</span>
              <span class="badge-maya">Maya</span>
            </div>
            <p class="coffee-payment-instruction">Scan the Maya QR code to send a contribution.</p>

            <div class="coffee-qr-wrapper">
              <img src="assets/images/payments/maya-qr.png" alt="Ethan's Maya QR code for voluntary support" loading="lazy">
            </div>

            <!-- TODO: Future payment methods (e.g. GCash, PayPal, Ko-fi) can be added here once supplied and verified by the owner -->
            <p class="coffee-coming-soon">
              <i class="fa-solid fa-clock"></i> More donation methods coming soon!
            </p>
          </div>

          <div class="coffee-modal-footer">
            <p>All contributions are completely voluntary. Please only contribute if you wish to.</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on close button click
    const closeBtn = modal.querySelector('#coffeeModalClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeCoffeeModal);
    }

    // Close on overlay background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeCoffeeModal();
      }
    });

    return modal;
  }

  function openCoffeeModal(e) {
    if (e) e.preventDefault();
    const modal = ensureCoffeeModal();
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Focus close button for keyboard accessibility
    const closeBtn = modal.querySelector('#coffeeModalClose');
    if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  }

  function closeCoffeeModal() {
    const modal = document.getElementById('coffeeModal');
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (navCoffeeBtn) navCoffeeBtn.focus();
  }

  // Attach click listener to navbar coffee button
  if (navCoffeeBtn) {
    navCoffeeBtn.addEventListener('click', openCoffeeModal);
  }

  // Fallback for any legacy hero coffee button
  if (legacyCoffeeBtn) {
    legacyCoffeeBtn.addEventListener('click', openCoffeeModal);
  }

  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('coffeeModal');
      if (modal && modal.classList.contains('active')) {
        closeCoffeeModal();
      }
    }
  });
}

/* ============================================================
   ADMIN PORTAL KEYBOARD SHORTCUT
   (Ctrl + Shift + A or Alt + A -> Redirects to admin/login.html)
   ============================================================ */
function initAdminShortcut() {
  document.addEventListener('keydown', (e) => {
    const isCtrlShiftA = (e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a');
    const isAltA = e.altKey && (e.key === 'A' || e.key === 'a');

    if (isCtrlShiftA || isAltA) {
      e.preventDefault();
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/admin/')) {
        window.location.href = 'admin/login.html';
      }
    }
  });
}

/* ============================================================
   7. DOWNLOAD CV BUTTON (placeholder — file not yet ready)
   ============================================================ */
function initDownloadCv() {
  const cvBtn = document.getElementById('downloadCvBtn');
  if (!cvBtn) return;

  cvBtn.addEventListener('click', (e) => {
    e.preventDefault();
    showToast('CV / Resume file is currently being updated and will be available for download soon.');
  });
}

/* ============================================================
   8. PROJECT IMAGE SCROLLERS (within carousel slides)
   ============================================================ */
function initProjectScrollers() {
  const slideImages = document.querySelectorAll('.slide-image');

  slideImages.forEach((slideImg) => {
    const scroller = slideImg.querySelector('.image-scroller');
    const prevBtn = slideImg.querySelector('.prev-btn');
    const nextBtn = slideImg.querySelector('.next-btn');

    if (scroller && scroller.children.length > 1) {
      if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
          const amount = scroller.clientWidth;
          scroller.scrollBy({ left: -amount, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', () => {
          const amount = scroller.clientWidth;
          scroller.scrollBy({ left: amount, behavior: 'smooth' });
        });
      }
    } else if (prevBtn && nextBtn) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    }
  });
}

/* ============================================================
   9. PROJECT CAROUSEL
   ============================================================ */
function initCarousel() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('carouselPrev');
  const nextBtn = document.getElementById('carouselNext');
  const dotsContainer = document.getElementById('carouselDots');
  const counter = document.getElementById('carouselCounter');

  if (!track || !prevBtn || !nextBtn || !dotsContainer || !counter) return;

  const slides = Array.from(track.children);
  const slideCount = slides.length;
  let currentIndex = 0;
  let isAnimating = false;

  // Create dots
  slides.forEach((_, idx) => {
    const dot = document.createElement('div');
    dot.classList.add('carousel-dot');
    if (idx === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goToSlide(idx));
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.children);

  function updateCarousel() {
    isAnimating = true;
    setTimeout(() => isAnimating = false, 600);

    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    dots.forEach(dot => dot.classList.remove('active'));
    dots[currentIndex].classList.add('active');

    counter.textContent = `${currentIndex + 1} / ${slideCount}`;
  }

  function goToSlide(index) {
    if (isAnimating || currentIndex === index) return;
    currentIndex = index;
    updateCarousel();
  }

  prevBtn.addEventListener('click', () => {
    if (isAnimating) return;
    currentIndex = currentIndex > 0 ? currentIndex - 1 : slideCount - 1;
    updateCarousel();
  });

  nextBtn.addEventListener('click', () => {
    if (isAnimating) return;
    currentIndex = currentIndex < slideCount - 1 ? currentIndex + 1 : 0;
    updateCarousel();
  });

  // Touch swipe support
  let startX = 0;
  let endX = 0;

  track.addEventListener('touchstart', e => {
    startX = e.changedTouches[0].screenX;
  }, { passive: true });

  track.addEventListener('touchend', e => {
    endX = e.changedTouches[0].screenX;
    if (isAnimating) return;
    const threshold = 50;
    if (startX - endX > threshold) {
      currentIndex = currentIndex < slideCount - 1 ? currentIndex + 1 : 0;
      updateCarousel();
    } else if (endX - startX > threshold) {
      currentIndex = currentIndex > 0 ? currentIndex - 1 : slideCount - 1;
      updateCarousel();
    }
  }, { passive: true });

  // Auto-scroll with pause on hover / touch
  let autoScrollInterval;

  function startAutoScroll() {
    autoScrollInterval = setInterval(() => {
      currentIndex = currentIndex < slideCount - 1 ? currentIndex + 1 : 0;
      updateCarousel();
    }, 5000);
  }

  function stopAutoScroll() {
    clearInterval(autoScrollInterval);
  }

  track.addEventListener('mouseenter', stopAutoScroll);
  track.addEventListener('mouseleave', startAutoScroll);
  track.addEventListener('touchstart', stopAutoScroll, { passive: true });
  track.addEventListener('touchend', startAutoScroll, { passive: true });

  updateCarousel();
  startAutoScroll();
}

/* ============================================================
   10. SKILLS DRAWER (off-canvas panel)
   ============================================================ */
function initSkillsDrawer() {
  const openBtn        = document.getElementById('openSkillsDrawer');
  const closeBtn       = document.getElementById('closeSkillsDrawer');
  const closeBtnBottom = document.getElementById('closeSkillsDrawerBottom');
  const overlay        = document.getElementById('skillsDrawerOverlay');
  const drawer         = document.getElementById('skillsDrawer');
  const searchInput    = document.getElementById('skillsSearch');
  const clearBtn       = document.getElementById('clearSkillsSearch');
  const catBtns        = document.querySelectorAll('.drawer-cat-btn');
  const grid           = document.getElementById('drawerSkillsGrid');
  const emptyState     = document.getElementById('drawerEmpty');
  const emptyTerm      = document.getElementById('emptySearchTerm');
  const countBadge     = document.getElementById('skillsCountBadge');

  if (!drawer || !overlay) return;

  const allCards = Array.from(drawer.querySelectorAll('.skill-card'));
  let activeFilter = 'all';
  let activatedBars = new Set();

  // ── Open ───────────────────────────────────────────────────
  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
    setTimeout(() => {
      if (searchInput) searchInput.focus();
      animateVisibleBars();
    }, 420);
  }

  // ── Close ──────────────────────────────────────────────────
  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
  }

  if (openBtn)        openBtn.addEventListener('click', openDrawer);
  if (closeBtn)       closeBtn.addEventListener('click', closeDrawer);
  if (closeBtnBottom) closeBtnBottom.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });

  // ── Filter + Search ────────────────────────────────────────
  function applyFilters() {
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    let visibleCount = 0;

    allCards.forEach(card => {
      const name     = (card.dataset.name     || '').toLowerCase();
      const category = (card.dataset.category || '').toLowerCase();
      const tooltip  = (card.dataset.tooltip  || '').toLowerCase();

      const matchesCategory = (activeFilter === 'all') || (category === activeFilter);
      const matchesSearch   = !query || name.includes(query) || tooltip.includes(query) || category.includes(query);

      if (matchesCategory && matchesSearch) {
        card.classList.remove('filtered-out');
        visibleCount++;
      } else {
        card.classList.add('filtered-out');
      }
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
      if (emptyTerm) emptyTerm.textContent = searchInput?.value || '';
    }
    if (grid) grid.style.display = visibleCount === 0 ? 'none' : 'grid';
    if (countBadge) countBadge.textContent = `${visibleCount} Technolog${visibleCount === 1 ? 'y' : 'ies'}`;

    animateVisibleBars();
  }

  // ── Animate Skill Bars (once per card) ─────────────────────
  function animateVisibleBars() {
    allCards.forEach((card, idx) => {
      if (!card.classList.contains('filtered-out') && !activatedBars.has(card)) {
        const delay = idx * 40;
        setTimeout(() => {
          card.classList.add('bar-animated');
          activatedBars.add(card);
        }, delay);
      }
    });
  }

  // ── Category tabs ──────────────────────────────────────────
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      if (searchInput) searchInput.value = '';
      if (clearBtn)    clearBtn.style.display = 'none';
      applyFilters();
    });
  });

  // ── Live search ────────────────────────────────────────────
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const hasVal = searchInput.value.length > 0;
      if (clearBtn) clearBtn.style.display = hasVal ? 'block' : 'none';
      catBtns.forEach(b => b.classList.remove('active'));
      const allBtn = drawer.querySelector('[data-filter="all"]');
      if (allBtn) allBtn.classList.add('active');
      activeFilter = 'all';
      applyFilters();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) { searchInput.value = ''; searchInput.focus(); }
      clearBtn.style.display = 'none';
      applyFilters();
    });
  }

  // ── 3D Tilt on drawer skill cards ─────────────────────────
  const MAX_TILT = 14;
  allCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
      const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
      card.style.transform = `perspective(600px) rotateX(${-dy * MAX_TILT}deg) rotateY(${dx * MAX_TILT}deg) translateY(-4px) scale(1.04)`;
      card.style.boxShadow = `${-dx * MAX_TILT * 0.6}px ${dy * MAX_TILT * 0.6}px 24px var(--accent-glow)`;
      card.style.borderColor = 'var(--border-hover)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform  = '';
      card.style.boxShadow  = '';
      card.style.borderColor = '';
      card.style.transition = 'transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s ease, border-color 0.3s';
      setTimeout(() => { card.style.transition = ''; }, 500);
    });
  });
}

/* ============================================================
   11. TOAST NOTIFICATION HELPER
   ============================================================ */
function showToast(message, type = 'info') {
  let toast = document.getElementById('portfolioToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'portfolioToast';
    toast.className = 'portfolio-toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.className = `portfolio-toast toast-${type} show`;

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// Export for global access in other scripts
window.showToast = showToast;

/* ============================================================
   12. FOOTER HELPERS (Dynamic Year & Back to Top)
   ============================================================ */
function initFooter() {
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }
}

/* ============================================================
   13. EXPANDABLE SKILLS CARDS (Interactive Tech Context)
   ============================================================ */
function initExpandableSkills() {
  const items = document.querySelectorAll('.tech-badge-item.expandable');
  items.forEach((item) => {
    const toggle = () => {
      const isExpanded = item.classList.toggle('is-expanded');
      item.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
    };

    item.addEventListener('click', () => {
      toggle();
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle();
      }
    });
  });
}

/* ============================================================
   14. INTERACTIVE PROJECT DETAILS MODAL
   ============================================================ */
function initProjectModals() {
  const modal = document.getElementById('projectDetailModal');
  if (!modal) return;

  const closeBtn = document.getElementById('closeProjectModal');
  const closeBottomBtn = document.getElementById('closeProjectModalBottom');
  const modalTitle = document.getElementById('projModalTitle');
  const modalRole = document.getElementById('projModalRole');
  const modalCategory = document.getElementById('projModalCategory');
  const modalTimeline = document.getElementById('projModalTimeline');
  const modalDesc = document.getElementById('projModalDesc');
  const modalTech = document.getElementById('projModalTech');
  const modalGallery = document.getElementById('projModalGallery');
  const modalLink = document.getElementById('projModalLink');

  const projectsData = {
    readora: {
      title: 'Readora — Virtual Bookshelf & Store',
      role: 'Frontend Developer & UI Designer',
      category: 'E-Commerce / Interactive Web Experience',
      timeline: 'Academic Project & Ongoing Study',
      desc: 'Readora is a responsive, interactive mock bookstore and virtual library platform celebrating tactile editorial design. Built with modular component architecture, smooth sliding book previews, real-time genre filtering, responsive catalog layout, and an intuitive cart interaction pattern.',
      tech: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'Node.js', 'Responsive UI'],
      images: [
        'assets/images/projects/Readora/Screenshot 2026-05-26 202500.png',
        'assets/images/projects/Readora/Screenshot 2026-05-26 202512.png',
        'assets/images/projects/Readora/Screenshot 2026-05-26 202615.png',
        'assets/images/projects/Readora/Screenshot 2026-05-26 202632.png'
      ],
      linkText: 'Visit Live Site',
      url: 'https://readoraupdate.netlify.app/'
    },
    'mock-gallery': {
      title: 'Pure CSS Image Gallery',
      role: 'CSS UI Architect & Layout Designer',
      category: 'Pure Frontend / Layout Engineering',
      timeline: 'Coursework Showcase',
      desc: 'A modern, responsive photo showcase created with pure HTML and CSS with zero JavaScript dependencies. Emphasizes modern layout mechanics, fluid CSS Grid, Flexbox alignment, CSS hover transitions, and accessible state styling.',
      tech: ['HTML5 Semantic', 'CSS3 Grid', 'CSS3 Flexbox', 'CSS Transitions'],
      images: [
        'https://i.ibb.co/GvhnvDfx/Screenshot-2026-03-28-080346.png',
        'https://i.ibb.co/fzfzW2dQ/Screenshot-2026-03-28-080409.png',
        'https://i.ibb.co/vvJjpfW3/Screenshot-2026-03-28-080447.png'
      ],
      linkText: 'Visit Live Demo',
      url: 'https://ethan-gacud-mock-gallery.netlify.app/'
    },
    icaredonate: {
      title: 'iCareDonate — Community Aid Platform',
      role: 'Project Manager / Team Leader & Fullstack Contributor',
      category: 'Full-Stack Web Application (Live)',
      timeline: 'Team Project / Capstone Milestone',
      desc: 'iCareDonate ("Give what you can. Help where it matters.") is a community assistance platform connecting verified donation drives with volunteers and donors in real time. As Project Manager and Team Leader, Ethan organized team task breakdowns, guided database schema architecture, ensured unified UI consistency, and implemented the administrative verification portal with transparent donor tracking.',
      tech: ['PHP (Backend)', 'MySQL / MariaDB', 'JavaScript', 'HTML5 / CSS3', 'Bootstrap', 'Role-Based Access Control', 'Vercel Deployment'],
      images: [
        'assets/images/projects/iCareDonate/HomePage.png',
        'assets/images/projects/iCareDonate/Admin_dashboard.png',
        'assets/images/projects/iCareDonate/Howitworks.png',
        'assets/images/projects/iCareDonate/howitworks1.png',
        'assets/images/projects/iCareDonate/LoginPage.png'
      ],
      linkText: 'Visit Live Demo',
      url: 'https://icaredonate.vercel.app/'
    },
    'c-game': {
      title: 'C Language Terminal Gaming Suite',
      role: 'System Logic & Algorithm Programmer',
      category: 'Console Software / Algorithm Design',
      timeline: 'Coursework (FOPR111)',
      desc: 'A modular, terminal-based gaming suite programmed in C99. Explores algorithmic flow control, pseudo-random number generators, pointer mechanics, robust input validation to prevent buffer overflows, and an intuitive nested menu interface.',
      tech: ['C Language (C99)', 'GCC Compiler', 'Terminal ANSI', 'Data Structures & Algorithms'],
      images: [
        'https://i.ibb.co/gFZKMhqf/Screenshot-2026-03-28-200143.png',
        'https://i.ibb.co/0zbRZz8/Screenshot-2026-03-28-201316.png'
      ],
      linkText: 'View on GitHub',
      url: 'https://github.com/ForgottenChatLoaf/C-language-Projects'
    }
  };

  const openModal = (projKey) => {
    const data = projectsData[projKey];
    if (!data) return;

    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fa-solid fa-folder-open" style="color: var(--accent);"></i> <span>${data.title}</span>`;
    }
    if (modalRole) modalRole.textContent = data.role;
    if (modalCategory) modalCategory.textContent = data.category;
    if (modalTimeline) modalTimeline.textContent = data.timeline;
    if (modalDesc) modalDesc.textContent = data.desc;

    if (modalTech) {
      modalTech.innerHTML = data.tech.map(t => `<span class="project-tech-badge">${t}</span>`).join('');
    }

    if (modalGallery) {
      modalGallery.innerHTML = data.images.map(img => `<img src="${img}" alt="${data.title} screenshot" loading="lazy">`).join('');
    }

    if (modalLink) {
      modalLink.href = data.url;
      modalLink.innerHTML = `${data.linkText} <i class="fa-solid fa-arrow-up-right-from-square"></i>`;
    }

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.open-project-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const proj = btn.getAttribute('data-project');
      openModal(proj);
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ============================================================
   15. INTERACTIVE CERTIFICATE VIEWER MODAL
   ============================================================ */
function initCertificateModals() {
  const modal = document.getElementById('certModal');
  if (!modal) return;

  const closeBtn = document.getElementById('closeCertModal');
  const closeBottomBtn = document.getElementById('closeCertModalBottom');
  const modalTitle = document.getElementById('certModalTitle');
  const modalIssuer = document.getElementById('certModalIssuer');
  const modalDate = document.getElementById('certModalDate');
  const modalDesc = document.getElementById('certModalDesc');
  const modalImg = document.getElementById('certModalImg');
  const modalPdfLink = document.getElementById('certModalPdfLink');

  const openModal = (card) => {
    const title = card.getAttribute('data-cert-title') || 'Certificate';
    const issuer = card.getAttribute('data-cert-issuer') || 'Verified Institution';
    const date = card.getAttribute('data-cert-date') || 'Verified';
    const desc = card.getAttribute('data-cert-desc') || '';
    const img = card.getAttribute('data-cert-img') || '';
    const pdf = card.getAttribute('data-cert-pdf') || '#';

    if (modalTitle) {
      modalTitle.innerHTML = `<i class="fa-solid fa-certificate" style="color: #f59e0b;"></i> <span>${title}</span>`;
    }
    if (modalIssuer) modalIssuer.innerHTML = issuer;
    if (modalDate) modalDate.textContent = date;
    if (modalDesc) modalDesc.textContent = desc;
    if (modalImg) modalImg.src = img;
    if (modalPdfLink) modalPdfLink.href = pdf;

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  document.querySelectorAll('.cert-preview-card').forEach(card => {
    card.querySelectorAll('.open-cert-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal(card);
      });
    });
  });

  closeBtn?.addEventListener('click', closeModal);
  closeBottomBtn?.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('open')) {
      closeModal();
    }
  });
}
