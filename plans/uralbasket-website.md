# Plan: UralBasket Website

> Source PRD: `docs/PRD-uralbasket.md`

## Architectural decisions

- **Pages (URLs):** `/` → `index.html` · `/catalog.html` · `/about.html` · `/blog/index.html` · `/blog/<slug>.html`
- **Assets:** `/images/` for all photos · `/css/styles.css` for shared styles · `/js/main.js` for shared JS
- **No build step:** plain HTML/CSS/JS, files served directly by Netlify
- **Order form:** Formspree POST endpoint (free tier), no backend required
- **Lightbox:** GLightbox (lightweight, zero-dependency) loaded via CDN
- **Design tokens:** CSS custom properties (`--color-*`, `--font-*`) defined once in `:root`, used everywhere
- **Responsive breakpoints:** mobile-first; tablet ≥ 640px, desktop ≥ 1024px
- **Navigation include:** header and footer HTML duplicated across pages (no JS templating needed for MVP)

---

## Phase 1: Foundation & Deploy

**User stories:** 2 (navigation), 14 (mobile-responsive), 15 (Russian language)

### What to build

Set up the complete project structure and deploy a live (empty) site to Netlify. Build the shared navigation header (logo + links to Главная / Каталог / О нас / Блог) and footer (contacts placeholder, copyright). Establish the CSS design system: color palette (earthy tones), typography (Playfair Display headings, system sans-serif body), spacing scale, and responsive grid. Every future page will inherit this shell.

### Acceptance criteria

- [ ] All page files exist (`index.html`, `catalog.html`, `about.html`, `blog/index.html`) with correct `<html lang="ru">` and UTF-8 charset
- [ ] Navigation renders correctly on all pages and all links work
- [ ] Footer appears on all pages with placeholder contact info
- [ ] Site is responsive: navigation collapses to a hamburger/stack on mobile
- [ ] CSS custom properties (`--color-primary`, etc.) are defined and applied to header/footer
- [ ] Site deploys to Netlify and is accessible via a public URL

---

## Phase 2: Homepage Hero

**User stories:** 1 (first impression with photos of work)

### What to build

Build the `index.html` hero section: full-width or large background image, headline introducing the craft, a short tagline, and a call-to-action button linking to the catalog. The section should look complete with placeholder images so the overall page feel is immediately apparent.

### Acceptance criteria

- [ ] Hero section occupies the top of `index.html` with a full-width image area
- [ ] Headline and tagline text are displayed in the design system fonts
- [ ] CTA button links to `catalog.html`
- [ ] Hero image is responsive (scales correctly on mobile and desktop)
- [ ] Page looks polished end-to-end with real or placeholder content

---

## Phase 3: Product Catalog

**User stories:** 3 (categories), 4 (product card), 9 (display-only items shown without order button)

### What to build

Build `catalog.html` with a full product grid. Products are hard-coded in HTML as cards containing: one image, product name, short description, and an optional "Заказать" button. Add category filter tabs (e.g. Корзины / Мебель / Декор / Все) that show/hide cards using JavaScript — no page reload. Display-only items simply omit the "Заказать" button; no special label needed.

### Acceptance criteria

- [ ] At least 2 product categories exist with 2+ sample items each
- [ ] Each product card shows: image, name, description
- [ ] Category filter tabs work: selecting a category hides cards from other categories instantly
- [ ] "Все" tab shows all products
- [ ] Cards without "Заказать" button render correctly alongside orderable items
- [ ] Grid is responsive: 1 column on mobile, 2 on tablet, 3 on desktop

---

## Phase 4: Image Lightbox

**User stories:** 5 (click image to enlarge)

### What to build

Wire GLightbox to every product image in the catalog. Clicking any product image opens a fullscreen lightbox overlay with the enlarged photo. The lightbox can be closed with a click outside, the Escape key, or a close button. No other changes to the catalog are needed.

### Acceptance criteria

- [ ] Clicking a product image opens GLightbox with the full-size photo
- [ ] Lightbox closes on Escape key, click outside, and close button
- [ ] Lightbox works correctly on mobile (touch swipe if multiple images, tap to close)
- [ ] GLightbox is loaded via CDN (no local install required)

---

## Phase 5: Order Form

**User stories:** 6 (order form opens), 7 (product name pre-filled), 8 (confirmation message), 16 (owner receives email), 17 (Formspree), 18 (easily disable order button)

### What to build

Each "Заказать" button opens a modal overlay containing an order form with fields: Имя (required), Телефон (required), Email, Комментарий, and a hidden field for the product name. When the button is clicked, JavaScript reads the product name from the card and injects it into the hidden field before the modal opens. The form submits via Formspree (AJAX). On success, the form is hidden and a "Спасибо, мы свяжемся с вами!" message is shown. The modal closes when clicking the backdrop or a close button.

### Acceptance criteria

- [ ] Clicking "Заказать" opens the modal with the correct product name in the hidden field
- [ ] All required fields (Имя, Телефон) are validated before submission
- [ ] Form submits to Formspree endpoint without page reload
- [ ] Success message is shown after submission; form fields are hidden
- [ ] Owner's inbox receives the email with customer data and product name
- [ ] Modal closes on backdrop click and close button
- [ ] Modal is accessible and usable on mobile
- [ ] Removing the "Заказать" button from a card is sufficient to make an item non-orderable (no other changes needed)

---

## Phase 6: About Us & Contacts

**User stories:** 12 (about page), 13 (contacts on about + footer)

### What to build

Build `about.html` with the following sections: a story section (text + photos of the two specialists), a craft/specialization section, and a contacts section at the bottom (phone, email, social media links). Update the footer across all pages with the same contact details. All contact links (tel:, mailto:, social URLs) should be functional.

### Acceptance criteria

- [ ] `about.html` has a story section with text and at least placeholder photos
- [ ] Contacts section appears at the bottom of `about.html` with phone, email, and social links
- [ ] Footer on all pages displays the same contacts
- [ ] All links (tel:, mailto:, social) are functional
- [ ] Page is responsive and visually consistent with the rest of the site

---

## Phase 7: Blog

**User stories:** 10 (read an article), 11 (browse article list with title, date, summary)

### What to build

Build `blog/index.html` as a list of article cards, each showing: title, publication date, and a short summary (2–3 sentences). Each card links to its article page. Create one sample article page (`blog/<slug>.html`) as the template for all future articles. The article page shows: title, date, hero image (optional), and body text formatted for readability.

### Acceptance criteria

- [ ] `blog/index.html` lists at least 2 sample article cards (title, date, summary, link)
- [ ] Each card links to a real article page
- [ ] Article page displays title, date, and formatted body text
- [ ] Blog index and article pages are responsive and styled consistently
- [ ] Adding a new article = creating one new HTML file and adding one card to `blog/index.html`
