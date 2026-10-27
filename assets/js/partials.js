/**
 * Partials Loader & Shared Navigation Logic
 * Handles Navbar and Footer across all portfolio pages
 * Manages theme toggling, active states, and mobile menu
 */

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

  // 2. If footer placeholder exists and is empty, fetch it; otherwise initialize existing footer
  const footerPlaceholder = document.getElementById('footer-placeholder') || document.getElementById('footer-container');
  const existingFooter = document.querySelector('footer');

  if (!existingFooter && footerPlaceholder) {
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
  const themeToggle = document.getElementById('themeToggle');
  const themeIcon = document.getElementById('themeIcon');
  const navLinks = document.querySelectorAll('.nav-link');
  const navLogo = document.querySelector('.nav-logo');

  if (isInsideAdmin) {
    if (navLogo) navLogo.setAttribute('href', `${basePath}index.html`);
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('../')) {
        link.setAttribute('href', `${basePath}${href}`);
      }
    });
  }

  // Detect active page
  const currentPage = document.body.dataset.page || detectPageFromUrl();
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

  // Theme Persistence & Toggle
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    if (themeIcon) {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  }

  if (themeToggle && !themeToggle._hasListener) {
    themeToggle._hasListener = true;
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('light-mode');
      const isLight = document.body.classList.contains('light-mode');
      localStorage.setItem('portfolio-theme', isLight ? 'light' : 'dark');

      if (themeIcon) {
        if (isLight) {
          themeIcon.classList.remove('fa-sun');
          themeIcon.classList.add('fa-moon');
        } else {
          themeIcon.classList.remove('fa-moon');
          themeIcon.classList.add('fa-sun');
        }
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

  if (isInsideAdmin) {
    const footerLogo = document.querySelector('.footer-logo');
    if (footerLogo) footerLogo.setAttribute('href', `${basePath}index.html`);
  }
}

function detectPageFromUrl() {
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith('about.html')) return 'about';
  if (path.endsWith('skills.html')) return 'skills';
  if (path.endsWith('projects.html')) return 'projects';
  if (path.endsWith('contact.html')) return 'contact';
  return 'home';
}
