#!/usr/bin/env node
/**
 * parse-tilda-csv.js
 * Converts a Tilda store CSV export into data/products.json format.
 *
 * Usage:
 *   node scripts/parse-tilda-csv.js <path-to-csv>
 *
 * Output:
 *   Overwrites data/products.json
 */

const fs   = require('fs');
const path = require('path');

const csvPath  = process.argv[2];
const outPath  = path.join(__dirname, '../data/products.json');

if (!csvPath) {
  console.error('Usage: node scripts/parse-tilda-csv.js <path-to-csv>');
  process.exit(1);
}

/* ------------------------------------------------------------------
   CSV parser — handles semicolon delimiter + double-quoted fields
   (Tilda uses ; as separator and "" to escape a literal " inside a
   quoted field)
------------------------------------------------------------------ */
function parseCSV(text) {
  const lines = text.split('\n').filter(l => l.trim());
  const headers = splitRow(lines[0]);
  return lines.slice(1).map(line => {
    const cols = splitRow(line);
    const row = {};
    headers.forEach((h, i) => {
      row[h.replace(/^"|"$/g, '').trim()] = (cols[i] || '').replace(/^"|"$/g, '').trim();
    });
    return row;
  }).filter(row => row['Tilda UID']); // skip empty rows
}

function splitRow(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ';' && !inQuote) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

/* ------------------------------------------------------------------
   Strip HTML tags from a string
------------------------------------------------------------------ */
function stripHtml(str) {
  return (str || '').replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

/* ------------------------------------------------------------------
   Map Tilda category string to our categories.
   The Tilda Category field is a semicolon-separated list of tags.
   "Корзины" wins over "аксессуар" or "интерьер" when both appear.
------------------------------------------------------------------ */
function mapCategory(tildaCat) {
  const cats = (tildaCat || '').toLowerCase();
  if (/колыбел|люльк/.test(cats))                         return 'cribs';
  if (/мебель|этаж|диван|кресл/.test(cats)) return 'furniture';
  if (/наполн|торгов/.test(cats)) return 'display_equipment';
  // Baskets beat decor — many basket products also have "аксессуар" tag
  if (/корзин|сундук|короб|бельев/.test(cats))            return 'baskets';
  if (/интерьер|дизайн|декор|аксессуар/.test(cats)) return 'decor';
  return 'baskets';
}

/* ------------------------------------------------------------------
   Transliterate Russian → Latin for URL-safe IDs
------------------------------------------------------------------ */
const TR = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',
  й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',
  у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',
  э:'e',ю:'yu',я:'ya',
};
function translit(str) {
  return str.toLowerCase().split('').map(c => TR[c] !== undefined ? TR[c] : c).join('');
}

function makeId(sku, externalId) {
  if (sku) return translit(sku).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  // Fall back to Tilda external ID (already alphanumeric)
  return externalId ? externalId.toLowerCase().slice(0, 20) : Math.random().toString(36).slice(2, 10);
}

/* ------------------------------------------------------------------
   Main transform
------------------------------------------------------------------ */
const raw = fs.readFileSync(csvPath, 'utf8');
const rows = parseCSV(raw);

console.log(`Parsed ${rows.length} products from CSV`);

const products = rows.map(row => {
  const images = (row['Photo'] || '')
    .split(/\s+/)
    .map(u => u.trim())
    .filter(Boolean);

  const price    = parseFloat(row['Price']) || null;
  const priceOld = parseFloat(row['Price Old']) || null;
  const qty      = row['Quantity'] !== '' ? parseInt(row['Quantity'], 10) : null;
  const weight   = parseFloat(row['Weight']) || null;
  const length   = parseFloat(row['Length']) || null;
  const width    = parseFloat(row['Width'])  || null;
  const height   = parseFloat(row['Height']) || null;

  const hasDimensions = length || width || height;

  return {
    id:          makeId(row['SKU'], row['External ID']),
    sku:         row['SKU'] || null,
    name:        row['Title'],
    category:    mapCategory(row['Category']),
    images,
    description: stripHtml(row['Description']),
    text:        stripHtml(row['Text']) || null,
    price,
    price_old:   priceOld,
    quantity:    qty !== null ? qty : 0,
    orderable:   qty === null ? true : qty > 0,
    weight,
    dimensions:  hasDimensions ? { length, width, height } : null,
    seo: {
      title:       row['SEO title'] || null,
      description: row['SEO descr'] || null,
      keywords:    row['SEO keywords'] || null,
    },
  };
});

const output = JSON.stringify({ products }, null, 2);
fs.writeFileSync(outPath, output, 'utf8');
console.log(`Written ${products.length} products to ${outPath}`);

// Print category breakdown
const counts = {};
products.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
console.log('Categories:', counts);
