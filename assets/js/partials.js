/**
 * Partials Loader & Shared Navigation Logic
 * Handles Navbar and Footer across all portfolio pages
 * Manages active states and mobile menu (dark mode only)
 */

/**
 * Self-contained toast for partials.js — used when main.js showToast isn't loaded yet.
 * Falls back gracefully and injects its own minimal styled element.
 */
function _partialsToast(message) {
  let toast = document.getElementById('_partialsToastEl');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = '_partialsToastEl';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: '10001',
      background: '#0f172a',
      color: '#10b981',
      border: '1px solid rgba(16,185,129,0.45)',
      borderRadius: '10px',
      padding: '13px 20px',
      fontSize: '14px',
      fontFamily: 'inherit',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      transform: 'translateY(80px)',
      opacity: '0',
      pointerEvents: 'none',
      transition: 'all 0.35s cubic-bezier(0.16,1,0.3,1)',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => {
    Object.assign(toast.style, { transform: 'translateY(0)', opacity: '1' });
  });
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    Object.assign(toast.style, { transform: 'translateY(80px)', opacity: '0' });
  }, 3500);
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavbarAndFooter();
});

async function setupNavbarAndFooter() {
  const isInsideAdmin = window.location.pathname.includes('/admin/');
  const basePath = isInsideAdmin ? '../' : '';

  // 1. If navbar placeholder exists and is empty, fetch it; otherwise initialize existing navbar
  const navPlaceholder = document.getElementById('navbar-placeholder') || document.getElementById('navbar-container');
  const existingNavbar = document.getElementById('navbar');

  if (!existingNavbar && navPlaceholder) {
    try {
      const res = await fetch(`${basePath}partials/navbar.html`);
      if (res.ok) {
        navPlaceholder.innerHTML = await res.text();
      }
    } catch (err) {
      console.warn('Navbar partial fetch fallback:', err);
    }
  }

  initNavbar(basePath, isInsideAdmin);

  // 2. Load shared footer: If footer placeholder exists, sync from partials/footer.html
  const footerPlaceholder = document.getElementById('footer-placeholder') || document.getElementById('footer-container');

  if (footerPlaceholder) {
    try {
      const res = await fetch(`${basePath}partials/footer.html`);
      if (res.ok) {
        footerPlaceholder.innerHTML = await res.text();
      }
    } catch (err) {
      console.warn('Footer partial fetch fallback:', err);
    }
  }

  initFooter(basePath, isInsideAdmin);
}

function initNavbar(basePath, isInsideAdmin) {
  const navbar = document.getElementById('navbar');
  const navMenu = document.getElementById('navMenu');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelectorAll('.nav-link');
  const navLogo = document.querySelector('.nav-logo');

  if (isInsideAdmin) {
    if (navLogo) navLogo.setAttribute('href', `${basePath}index.php#home`);
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('../')) {
        link.setAttribute('href', `${basePath}${href}`);
      }
    });
  }

  // Detect active page & handle single-page Home/About scrolling
  const currentPage = document.body.dataset.page || detectPageFromUrl();
  const homeSec = document.getElementById('home');
  const aboutSec = document.getElementById('about');
  const homeLink = document.querySelector('.nav-link[data-page="home"]');
  const aboutLink = document.querySelector('.nav-link[data-page="about"]');

  if (homeSec && aboutSec) {
    // We are on index.php (combined Home + About)
    const updateScrollSpy = () => {
      const scrollPos = window.scrollY + 180;
      const aboutTop = aboutSec.offsetTop;
      if (scrollPos >= aboutTop) {
        aboutLink?.classList.add('active');
        aboutLink?.setAttribute('aria-current', 'page');
        homeLink?.classList.remove('active');
        homeLink?.removeAttribute('aria-current');
      } else {
        homeLink?.classList.add('active');
        homeLink?.setAttribute('aria-current', 'page');
        aboutLink?.classList.remove('active');
        aboutLink?.removeAttribute('aria-current');
      }
    };

    window.addEventListener('scroll', updateScrollSpy, { passive: true });

    // Smooth intra-page anchor clicks without reloading
    [homeLink, aboutLink].forEach(link => {
      if (!link) return;
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href') || '';
        const hash = href.includes('#') ? href.split('#')[1] : '';
        if (hash) {
          const targetEl = document.getElementById(hash);
          if (targetEl) {
            e.preventDefault();
            targetEl.scrollIntoView({ behavior: 'smooth' });
            history.replaceState(null, '', '#' + hash);
            setTimeout(updateScrollSpy, 200);
          }
        }
      });
    });

    // Check if loaded with #about
    if (window.location.hash === '#about') {
      setTimeout(() => {
        aboutSec.scrollIntoView({ behavior: 'smooth' });
        updateScrollSpy();
      }, 300);
    } else {
      updateScrollSpy();
    }
  } else {
    // Normal multi-page active class assignment
    navLinks.forEach(link => {
      const pageAttr = link.getAttribute('data-page');
      if (pageAttr === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      } else {
        link.classList.remove('active');
        link.removeAttribute('aria-current');
      }
    });
  }

  // Hamburger Mobile Toggle
  if (hamburger && navMenu && !hamburger._hasListener) {
    hamburger._hasListener = true;
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      navMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        hamburger.classList.remove('open');
        navMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.focus();
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (navbar) {
      if (window.scrollY > 40) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
  }, { passive: true });
}

function initFooter(basePath, isInsideAdmin) {
  const yearSpan = document.getElementById('currentYear');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  const backToTopBtn = document.getElementById('backToTopBtn');
  if (backToTopBtn && !backToTopBtn._hasListener) {
    backToTopBtn._hasListener = true;
    backToTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Email Copy to Clipboard Interaction
  const copyEmailBtn = document.getElementById('footerCopyEmailBtn');
  if (copyEmailBtn && !copyEmailBtn._hasListener) {
    copyEmailBtn._hasListener = true;
    copyEmailBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const email = copyEmailBtn.getAttribute('data-email') || 'ethangacud@gmail.com';

      // Helper: show copied state + toast
      function _onCopied() {
        const icon = document.getElementById('copyEmailIcon');
        const text = document.getElementById('copyEmailText');
        copyEmailBtn.classList.add('copied');
        if (icon) icon.className = 'fa-solid fa-check';
        if (text) text.textContent = 'Copied!';
        if (typeof window.showToast === 'function') {
          window.showToast('📋 Email copied to clipboard!', 'success');
        } else {
          _partialsToast('📋 Email copied to clipboard!');
        }
        setTimeout(() => {
          copyEmailBtn.classList.remove('copied');
          if (icon) icon.className = 'fa-solid fa-envelope';
          if (text) text.textContent = 'Email (Copy)';
        }, 2500);
      }

      // Try modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(_onCopied).catch(() => {
          // Fallback: legacy execCommand
          _execCommandCopy(email) ? _onCopied() : (window.location.href = `mailto:${email}`);
        });
      } else {
        // Fallback for older browsers
        _execCommandCopy(email) ? _onCopied() : (window.location.href = `mailto:${email}`);
      }
    });
  }

  function _execCommandCopy(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (_) {
      return false;
    }
  }

  // Scroll Progress Bar Tracker
  const progressBar = document.getElementById('scrollProgressBar');
  if (progressBar && !window._hasScrollProgress) {
    window._hasScrollProgress = true;
    window.addEventListener('scroll', () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }, { passive: true });
  }

  if (isInsideAdmin) {
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) footerLogo.setAttribute('href', `${basePath}index.php#home`);
  }
}

function detectPageFromUrl() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  if (hash === '#about' || path.endsWith('about.html')) return 'about';
  if (path.endsWith('skills.html') || path.endsWith('skills.php')) return 'skills';
  if (path.endsWith('projects.html') || path.endsWith('projects.php')) return 'projects';
  if (path.endsWith('contact.html') || path.endsWith('contact.php')) return 'contact';
  return 'home';
}
