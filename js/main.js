/* ============================================================
   main.js — shared site-wide behaviour
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  highlightActiveLink();
});

/* ------------------------------------------------------------------
   Navigation: hamburger toggle
------------------------------------------------------------------ */
function initNav() {
  const toggle = document.querySelector('.nav-toggle');
  const nav    = document.querySelector('.site-nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('is-open', !isOpen);
  });

  // Close when clicking outside the header
  document.addEventListener('click', (e) => {
    if (
      nav.classList.contains('is-open') &&
      !nav.contains(e.target) &&
      !toggle.contains(e.target)
    ) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

/* ------------------------------------------------------------------
   Navigation: highlight current page link
------------------------------------------------------------------ */
function highlightActiveLink() {
  const path = window.location.pathname;

  document.querySelectorAll('.site-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    // Exact match, or root path for home
    const isHome    = (path === '/' || path.endsWith('/index.html')) && (href === '/' || href === '/index.html');
    const isBlog    = path.includes('/blog') && href.includes('/blog');
    const isExact   = path.endsWith(href) || path === href;

    if (isHome || isBlog || isExact) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });
}
