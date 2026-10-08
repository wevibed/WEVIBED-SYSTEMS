# Architecture and decisions

## Why one monorepo

The audit of 29 existing repositories found eight that share 60-85 of 87 source files with each other
(md5 comparison). Each client was a full copy, so every fix had to be repeated per repository and
business details had to be hunted through dozens of files (which is how a baby-care site ended up titled
"Sassy Lady Shoes"). Template repositories would speed up creation but not maintenance. Here:

- a fix to `packages/core` is made once and verified against every client in one CI run
- a client is a data folder (config, content, images), not a code fork
- a new client costs a folder, not a repository

## How a site is built

`tools/build.mjs` runs checks, then Vite with **one shared config** (`packages/build/vite.base.mjs`) for a pair
(template, client folder):

1. The Vite plugin reads and **validates** the client folder (fails the build with a readable message if wrong)
2. It exposes the data to React as the virtual module `virtual:wevibed-client`
3. It writes the SEO `<head>` into the static HTML (title, description, Open Graph, canonical, JSON-LD, theme variables, fonts), plus `robots.txt`, `sitemap.xml` and `_headers`
4. The client's `assets/` folder becomes the site's public folder
5. Tailwind 3 reads colours and fonts from CSS variables generated from `brand` in the config, so one template looks different per client
6. `checkBuilt` verifies the output (tags present, files present, assets copied, robots correct for the status)

## Reuse

| Shared code | Used by |
|---|---|
| Header (responsive, 3 looks), Footer (2 looks), SiteLayout, skip link | all templates |
| HeroFull, HeroSplit | construction, hardware / retail |
| EnquiryForm (WhatsApp or endpoint, validation, honeypot, honest failure message) | all templates |
| ContactDetails, WhatsAppFloat, CTABand, Testimonials | all templates |
| MediaGallery + lightbox, FilterChips | construction, and the catalogue filters |
| Catalog: search, filters, cart, order message, price text | retail, hardware |

Industry-specific parts stay in the template (`ProductCard`, `ServiceCards`, `ProcessSteps`, page layouts),
so templates do not look identical. Each template sets its own fonts, header look, shapes and sections.

## Provenance (what came from where)

- Cart, search and WhatsApp order message: extracted from the single-file Macrowan Hardware site
- Config-per-site idea and shop structure: the Base44-export family (`sassy-wevibed` and copies)
- Project gallery, services and quote flow: Ngenaz Builders
- Dependency versions: taken from `ngenaz-builders/package-lock.json` (Vite 8.3, plugin-react 6.1, Tailwind 3.4)
- Not carried over, deliberately: 53 shadcn UI files of which 3 were used, Stripe/three/jspdf/moment/lodash and other unused dependencies

## Decisions

| Decision | Reason |
|---|---|
| JavaScript, not TypeScript | Matches all existing repos. The config schema validates data at build time instead |
| Tailwind 3 | Matches 8 existing repos; no measured benefit yet from v4 |
| Dependency-free validators, checks, tests | They run before `npm install`, so they work in restricted environments and give instant feedback |
| Forms: WhatsApp handoff by default, optional endpoint | See STATUS.md, forms audit |
| `status` field drives indexing | `demo`/`draft` sites are `noindex` + `Disallow: /`, so previews never reach Google |
| Placeholders are marked and block `live` | Prevents sample text, dummy numbers and stock photos reaching a client site |
| Client names in `tools/leak-terms.json` | Catches cross-client copy-paste. Add each new client's name |

## Migrating an existing client (optional, one at a time, never automatic)

1. Create the client folder with `new-client` using the closest template
2. Copy the existing site's real content (products, photos, text) into `content/` and `assets/`
3. `npm run dev -- --client <slug>` and compare with the live site on a phone
4. Deploy to a **new** Pages project (`deploy.cloudflareProject` = a new name). The old site is untouched
5. Only after the client approves: point the domain at the new project, keep the old repo for rollback

## Adding a template

Create `templates/<name>/` with `template.json` (routes, default nav, required content), `index.html`,
`src/main.jsx` (`mountApp(App)`), `src/App.jsx`, pages and components, and a `starter/` folder (config, content).
Run `npm run placeholders -- --starter <name>`, then `npm run check`, `npm run check:imports`, `npm test`.
A test already verifies that `template.json` routes match the routes in `App.jsx`.
