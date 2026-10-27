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
  initCoffeeButton();
  initProjectScrollers();
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
   6. BUY ME A COFFEE BUTTON (Phase 4 Placeholder)
   ============================================================ */
function initCoffeeButton() {
  const coffeeBtn = document.getElementById('buyMeCoffeeBtn');
  if (!coffeeBtn) return;

  coffeeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    // TODO: Replace with real Buy Me a Coffee or Ko-fi URL once Ethan sets up donations
    // Example: window.open('https://buymeacoffee.com/ethangacud', '_blank', 'noopener,noreferrer');
    showToast('Buy Me a Coffee link is coming soon! Thank you for your support.');
  });
}

/* ============================================================
   7. PROJECT IMAGE SCROLLERS
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
   8. TOAST NOTIFICATION HELPER
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
