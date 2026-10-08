# Client configuration reference

Each client is a folder: `clients/<slug>/client.config.json`, `clients/<slug>/content/*.json`,
`clients/<slug>/assets/`. The schema lives in `packages/config/src/schema.js` and is enforced at build time
and by `npm run check`; unknown fields are errors so typos cannot silently do nothing.
Asset paths start with `/` and point into `assets/` (`/products/boots.jpg` = `assets/products/boots.jpg`).

## client.config.json

| Field | Required | Notes |
|---|---|---|
| `schemaVersion` | yes | `1` |
| `status` | yes | `demo`, `draft` or `live`. Only `live` is indexed by search engines. `live` is blocked while placeholders remain |
| `template` | yes | `retail`, `hardware`, `construction` |
| `business.name` | yes | Shown in header, footer, title, WhatsApp messages |
| `business.shortName` | no | Used in the header if the name is long |
| `business.tagline` | yes | Max 80 characters; becomes part of the page title |
| `business.description` | yes | 20-300 characters (70-160 is ideal); meta description and share text |
| `business.schemaType` | no | schema.org type for Google, e.g. `HardwareStore`, `GeneralContractor`, `ClothingStore` |
| `contact.whatsapp` | yes | Digits with country code, no `+` or spaces: `263771234567` |
| `contact.phone` | no | Only if the call number differs from WhatsApp |
| `contact.phoneDisplay` | yes | How the number is shown: `077 123 4567` |
| `contact.email` | no | |
| `contact.address` | yes | `line1`, optional `line2`, `city`, `country` |
| `contact.mapsUrl` | no | Link for "Get directions" |
| `contact.hours` | no | `[{ "days": "Mon – Fri", "time": "08:00 – 17:00" }]` |
| `social` | no | `facebook`, `instagram`, `tiktok`, `x` as full URLs |
| `brand.logo` | yes | `/logo.svg` or PNG; also the favicon |
| `brand.logoOnly` | no | `true` if the logo already contains the business name |
| `brand.colors` | yes | `primary`, `accent` (required); `background`, `foreground` (optional). Hex. Contrast is checked and an accessible accent-for-text colour is derived automatically |
| `brand.fonts` | yes | `heading`, `body` as Google Font names; `headingSerif: true` for serif fallbacks |
| `brand.radius` | no | Corner rounding, e.g. `0rem`, `0.375rem` |
| `hero` | yes | `image`, `imageAlt`, `headline` (max 90), `subheadline` (max 220); optional `eyebrow`, `ctaLabel`, `ctaTo` |
| `nav` | no | Overrides the template menu: `[{ "label": "Shop", "to": "/shop" }]`. Routes must exist in the template |
| `features` | no | `cart`, `search`, `quoteForm`, `whatsappFloat` (booleans; templates use what applies) |
| `seo.domain` | yes | Bare domain: `acme.co.zw` |
| `seo.ogImage` | yes | **PNG or JPG**, 1200x630. SVG does not work for link previews |
| `forms.mode` | no | `whatsapp` (default) or `endpoint` |
| `forms.endpoint` | if endpoint | https URL that accepts a JSON POST (Formspree, Web3Forms, a Worker) |
| `currency` | yes | `{ "code": "USD", "symbol": "$" }` |
| `deploy.cloudflareProject` | yes | Cloudflare Pages project name, lowercase-hyphen |

## Content files (`content/<name>.json`)

| File | Used by | Shape |
|---|---|---|
| `products.json` | retail, hardware | `categories: []`, `items: [{ id, name, category, price \| null, priceLabel?, unit?, description?, image, images?, sizes?, availability?, badges?, keywords?, placeholder? }]` |
| `projects.json` | construction | `categories: []`, `items: [{ id, title, category, image, alt, location?, year?, summary?, placeholder? }]` |
| `services.json` | construction | `items: [{ id, title, description, image?, imageAlt?, placeholder? }]` |
| `about.json` | retail, construction | `heading`, `paragraphs: []`, `highlights?: [{ title, text }]`, `image?`, `imageAlt?` |
| `process.json` | construction, hardware | `heading?`, `steps: [{ title, text }]` |
| `testimonials.json` | retail, construction | `items: [{ name, text, role? }]`. Real quotes only |

Notes:

- `id` is a lowercase-hyphen slug and becomes the URL (`/product/<id>`); it must be unique.
- `availability`: `in_stock`, `low_stock`, `sold_out`, `enquire`. `badges`: `new`, `featured`.
- `price: null` shows "Enquire for price"; `priceLabel` overrides the displayed price text (`"From $25 per roll"`).
- `"placeholder": true` marks unconfirmed content. The check warns while the site is a draft and **blocks `live`**.
- Product search matches name, category, keywords and description, all words must match.
- Which files a template needs is declared in `templates/<t>/template.json` (`content.required`).

## Images

- Photos of real products and real work only. The check rejects remote stock URLs (Pexels, Unsplash, placeholders).
- Hero 1600 px wide or more, under about 1.2 MB. Product and project photos under about 600 KB. Prefer JPG or WebP.
- `alt` text is required for project photos and the hero (it is what screen readers and Google read).
- `npm run placeholders -- --client <slug>` fills any gap with a labelled placeholder (SVG or PNG only).
