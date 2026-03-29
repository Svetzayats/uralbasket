/* ============================================================
   catalog.js — data-driven product rendering + filter tabs

   To add a product: append one object to /data/products.json.
   No other files need editing.
   ============================================================ */

document.addEventListener('DOMContentLoaded', initCatalog);

async function initCatalog() {
  const grid = document.getElementById('product-grid');
  if (!grid) return;

  let products;
  try {
    const res = await fetch('/data/products.json');
    if (!res.ok) throw new Error(res.statusText);
    products = await res.json();
  } catch (err) {
    grid.innerHTML = `
      <p class="catalog-error">
        Не удалось загрузить каталог. Пожалуйста, обновите страницу или свяжитесь с нами.
      </p>`;
    return;
  }

  renderCards(grid, products);
  initLightbox();
  initFilter(products);
  initOrderModal();
}

/* ------------------------------------------------------------------
   Render
------------------------------------------------------------------ */
function renderCards(grid, products) {
  grid.innerHTML = products.map(cardHTML).join('');
}

function cardHTML(product) {
  const orderBtn = product.orderable
    ? `<button class="btn btn-primary order-btn"
               data-product="${esc(product.name)}">Заказать</button>`
    : '';

  return `
    <article class="product-card" data-category="${esc(product.category)}" data-id="${esc(product.id)}">
      <div class="product-img-wrap">
        <a
          href="/images/products/${esc(product.image)}"
          class="glightbox"
          data-title="${esc(product.name)}"
          aria-label="Увеличить фото: ${esc(product.name)}"
        >
          <img
            src="/images/products/${esc(product.image)}"
            alt="${esc(product.name)}"
            class="product-img"
          />
        </a>
      </div>
      <div class="product-body">
        <h3 class="product-name">${esc(product.name)}</h3>
        <p class="product-desc">${esc(product.description)}</p>
        ${orderBtn}
      </div>
    </article>`;
}

/* ------------------------------------------------------------------
   Lightbox
------------------------------------------------------------------ */
function initLightbox() {
  GLightbox({
    selector:    '.glightbox',
    touchNavigation: true,
    loop:        false,
    zoomable:    false,
  });
}

/* ------------------------------------------------------------------
   Filter tabs
------------------------------------------------------------------ */
function initFilter(products) {
  const tabs = document.querySelectorAll('.filter-tab');
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      tabs.forEach((t) => {
        t.classList.toggle('is-active', t === tab);
        t.setAttribute('aria-selected', String(t === tab));
      });

      document.querySelectorAll('.product-card').forEach((card) => {
        const visible = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('is-hidden', !visible);
      });
    });
  });

  // Pre-select category from URL query param, e.g. /catalog.html?category=baskets
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  if (cat) {
    const tab = [...tabs].find((t) => t.dataset.filter === cat);
    if (tab) tab.click();
  }
}

/* ------------------------------------------------------------------
   Order modal
------------------------------------------------------------------ */
function initOrderModal() {
  const modal        = document.getElementById('order-modal');
  const form         = document.getElementById('order-form');
  const closeBtn     = modal.querySelector('.modal-close');
  const productInput = document.getElementById('order-product');
  const titleEl      = document.getElementById('modal-title');
  const successEl    = document.getElementById('order-success');

  if (!modal || !form) return;

  // Open — event delegation so it works on dynamically rendered buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.order-btn');
    if (!btn) return;

    const name = btn.dataset.product || '';
    titleEl.textContent = name ? `Заказать: ${name}` : 'Оформить заказ';

    form.reset();
    productInput.value = name;   // restore after reset
    form.hidden  = false;
    successEl.hidden = true;

    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled    = false;
    submitBtn.textContent = 'Отправить заявку';

    openModal(modal);
  });

  // Close — backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  // Close — button
  closeBtn.addEventListener('click', () => closeModal(modal));

  // Close — Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) closeModal(modal);
  });

  // Submit via Formspree AJAX
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('.form-submit');
    submitBtn.disabled    = true;
    submitBtn.textContent = 'Отправляем…';

    try {
      const res = await fetch(form.action, {
        method:  'POST',
        body:    new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error();
      form.hidden     = true;
      successEl.hidden = false;
    } catch {
      submitBtn.disabled    = false;
      submitBtn.textContent = 'Отправить заявку';
      alert('Не удалось отправить заявку. Попробуйте ещё раз или свяжитесь с нами напрямую.');
    }
  });
}

function openModal(modal) {
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  const first = modal.querySelector('input:not([type=hidden])');
  if (first) first.focus();
}

function closeModal(modal) {
  modal.hidden = true;
  document.body.style.overflow = '';
}

/* ------------------------------------------------------------------
   Utility: escape HTML to prevent XSS when inserting into innerHTML
------------------------------------------------------------------ */
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
