# PRD: Catalog Management & Admin Panel

## Problem Statement

The site owner manages product data and the catalog manually by editing JSON files directly. There is no way to control which products appear in the catalog, in what order, or to insert promotional "link cards" (pointing to blog articles) between product cards. Updating a product requires editing a large raw JSON file, with no interface and no guardrails.

## Solution

Introduce a `catalog.json` file that acts as the ordered manifest of everything shown in the catalog — product references (by ID) and link cards (image + title + URL). `products.json` remains the single source of truth for all product data. A password-protected admin panel, hosted on Netlify, allows the owner to edit product data, manage catalog visibility and order, and configure link cards. Changes are saved by committing updated JSON files to GitHub via the GitHub API, which triggers an automatic Netlify redeploy.

---

## User Stories

### Catalog rendering
1. As a site visitor, I want the catalog to show only curated products (not the full internal database), so that I see a clean, intentional selection.
2. As a site visitor, I want catalog cards to appear in a specific order set by the owner, so that featured products appear first.
3. As a site visitor, I want to see "link cards" mixed into the catalog grid that visually match product cards but link to a blog article, so that I can discover editorial content naturally.
4. As a site visitor, I want a link card to open its blog article in a new tab when clicked, so that I don't lose my place in the catalog.
5. As a site visitor, I want to filter link cards along with product cards (link cards belong to a category and are shown/hidden by the filter tabs), so that the catalog filter works consistently.
6. As a site visitor, I want out-of-stock products to still appear in the catalog (without an order button) rather than disappear, so that I can see the full range of products.

### Admin — authentication
7. As the owner, I want the admin panel to be password-protected, so that random visitors cannot access it.
8. As the owner, I want to enter my password once per session (stored in sessionStorage), so that I don't have to re-enter it on every page reload.

### Admin — product list
9. As the owner, I want to see all products from `products.json` in a searchable list, so that I can quickly find any product.
10. As the owner, I want to see at a glance whether each product is included in the catalog, so that I know the current catalog selection.
11. As the owner, I want to filter the product list by category, so that I can manage products by type.

### Admin — product editing
12. As the owner, I want to edit a product's name, description, price, old price, and quantity from the admin panel, so that I can keep product info up to date.
13. As the owner, I want to toggle a product's `orderable` flag, so that I can enable or disable the "Заказать" button without deleting the product.
14. As the owner, I want to assign categories to a product (selecting from existing values), so that the catalog filter works correctly.
15. As the owner, I want to edit the list of image URLs for a product, so that I can update photos.
16. As the owner, I want changes I make to a product to be reflected everywhere that product appears (catalog, any future pages), because `products.json` is the single source of truth.

### Admin — catalog management
17. As the owner, I want to include or exclude any product from the catalog with a single toggle, so that I can quickly show or hide items.
18. As the owner, I want to reorder catalog items (products and link cards) using drag-and-drop or up/down controls, so that I can control the display order.
19. As the owner, I want to add a link card to the catalog by providing an image URL, a title, a short description, and a blog post URL, so that I can promote editorial content.
20. As the owner, I want to edit or remove existing link cards, so that I can keep promotional content current.
21. As the owner, I want to assign a category to a link card, so that it shows/hides correctly with the catalog filter tabs.

### Admin — saving
22. As the owner, I want a single "Save" button that commits all pending changes to GitHub, so that I never accidentally publish a half-finished edit.
23. As the owner, I want to enter my GitHub personal access token once (stored in localStorage), so that the save action can commit on my behalf.
24. As the owner, I want to see a clear success or error message after saving, so that I know whether the publish succeeded.
25. As the owner, I want the save to commit both `products.json` and `catalog.json` in one GitHub commit, so that the two files stay in sync.

---

## Implementation Decisions

### Data layer

- **`products.json`** — unchanged schema; single source of truth for all product data (156 products, array wrapped in `{ "products": [...] }`).
- **`catalog.json`** — new file; a single ordered array of items. Each item is either:
  - `{ "type": "product", "id": "<product-id>" }` — reference to a product in `products.json`
  - `{ "type": "link", "image": "<url>", "title": "<text>", "description": "<text>", "url": "<url>", "category": "<category-slug>" }` — standalone link card
- The catalog page renders items in the exact order defined by `catalog.json`.
- Products not referenced in `catalog.json` are simply not shown in the catalog.

### Catalog page (`catalog.js`) changes

- Fetch both `/data/catalog.json` and `/data/products.json` in parallel on page load.
- Build a product map `{ id → product }` from `products.json`.
- Render cards in `catalog.json` order: for each item, call the appropriate card renderer (`productCard` or `linkCard`).
- `linkCard` renders an anchor tag wrapping an image, title, and description. `target="_blank" rel="noopener"`.
- Link cards participate in category filtering via their `category` field.
- The existing GLightbox, order modal, and filter-tab logic remain unchanged.

### Admin panel (`admin/index.html`)

Single-page admin at `/admin/index.html` (no build step, plain JS).

**Modules (logical sections, all in one file or a small set of files):**

1. **Auth gate** — on load, check sessionStorage for password hash; if absent, show password prompt. Hardcoded bcrypt-like check (or simple string comparison with a hardcoded secret) — no server needed.
2. **Data loader** — fetches both JSON files; holds mutable in-memory state (`products[]`, `catalogItems[]`).
3. **Product list view** — table/list of all products with search box and category filter. Each row shows: name, categories, price, `orderable`, in-catalog toggle. Clicking a row opens the product editor.
4. **Product editor panel** — form with fields: name, description, price, price_old, quantity, orderable (checkbox), categories (multi-select or tag input), images (textarea, one URL per line). Save updates in-memory state only.
5. **Catalog order view** — shows current `catalogItems[]` as a sortable list. Each item shows a thumbnail + name/title. Controls: remove from catalog, move up/down (or drag-and-drop). "Add link card" button opens a link card editor form. "Add product" opens a product picker modal.
6. **Link card editor** — small form: image URL, title, description, URL, category. Used for both add and edit.
7. **Save button** — reads GitHub token from localStorage (prompts once if absent); calls GitHub Contents API to PUT both files in one commit.
8. **Status bar** — shows "Unsaved changes", "Saving…", "Saved ✓", or error message.

### GitHub save mechanism

- Uses GitHub REST API: `PUT /repos/{owner}/{repo}/contents/{path}`
- Requires: repo owner, repo name, branch (`main`), and a personal access token with `contents: write` scope.
- Fetches current file SHA for both files before writing (required by GitHub API).
- Commits both files as two sequential API calls with the message "Admin: update products and catalog".
- Token stored in `localStorage` under a namespaced key; never sent anywhere except GitHub's own API.

### Auth

- Hardcoded password checked in JS (not cryptographically secure, but acceptable for this use case).
- Password stored as a constant in the admin JS. Passed in sessionStorage as a flag once verified.
- No backend required.

---

## Testing Decisions

Testing is manual (no automated test suite currently exists in this project):

- **Catalog rendering:** After updating `catalog.json`, verify the catalog page shows only the listed products in the correct order. Verify link cards render and open in new tabs. Verify category filter hides/shows link cards correctly.
- **Admin save:** Enter a valid GitHub token, make a change, click Save. Verify a new commit appears in GitHub and Netlify redeploys with the updated data.
- **Product edit round-trip:** Edit a product in admin, save, reload the catalog page, verify the change is visible.
- **Link card round-trip:** Add a link card in admin, save, verify it appears in the catalog in the correct position and category.
- **Auth:** Reload admin without saved session; verify password prompt appears. Enter wrong password; verify access is denied.

---

## Out of Scope

- Real-time / auto-save — all changes are batched and committed on explicit Save only.
- Blog post management — admin manages catalog and products only; blog articles remain hand-written HTML files.
- Image upload — images are referenced by URL only; file uploads are out of scope.
- Multi-user access / role-based permissions — single owner only.
- Audit log / change history — GitHub commit history serves this purpose.
- SEO field editing — `seo` object in products.json is not exposed in the admin UI.
- Netlify Identity or any proper OAuth flow — simple JS password only.

---

## Further Notes

- The GitHub token gives write access to the repo. The owner should create a fine-grained token scoped to this repo and `contents: write` only.
- The content.md file also mentions future per-blog-post product lists (e.g. "all baskets for mushroom picking"). This is out of scope for this PRD but the link card mechanism supports it: a link card pointing to that blog post can be added to the catalog.
- `catalog.json` should be bootstrapped from the product list in `content.md` (the ~45 named products) as the initial set.
