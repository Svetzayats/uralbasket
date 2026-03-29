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
