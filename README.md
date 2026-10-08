# WeVibed System

One repository that turns **a template + a client folder** into a deployed website.

```
clients/<slug>/          what changes per client: client.config.json, content/*.json, assets/
templates/<industry>/    industry-specific pages and components, plus a ready-to-run starter/
packages/core/           shared UI: header, footer, hero, forms, gallery, WhatsApp, layout
packages/catalog/        shared shop logic: search, filters, cart, WhatsApp order message
packages/config/         the client config schema and validator
packages/build/          Vite plugin, SEO tags, quality checks, placeholder images, live checks
tools/                   new-client, check, build, dev, timing, verify-live, make-placeholders
.github/workflows/       CI (verify everything) and Deploy client (approval-gated, Cloudflare Pages)
docs/                    WORKFLOW, CLIENT-CONFIG, ARCHITECTURE, STATUS
```

> **Verification status:** see [docs/STATUS.md](docs/STATUS.md). Nothing in this repo has been built with
> Vite yet. The first green GitHub Actions run is what turns "written" into "verified".

## Requirements

Node 22 and npm. Everything is plain JavaScript (JSX), Vite 8, React 18, Tailwind CSS 3.

## Start a new client (about 10 minutes to a live preview)

```bash
npm ci
npm run new-client -- --template hardware --slug acme-hardware --name "Acme Hardware" \
    --whatsapp 263771234567 --domain acmehardware.co.zw --city Harare
npm run dev -- --client acme-hardware        # live preview; edits to the JSON reload instantly
npm run check                                # must be clean before status can be "live"
git add clients/acme-hardware && git commit -m "Add Acme Hardware" && git push
```

Then in GitHub: **Actions → Deploy client → Run workflow → `acme-hardware`**. The full checklist, from
first call with the client to final verification, is in [docs/WORKFLOW.md](docs/WORKFLOW.md).

## Commands

| Command | What it does |
|---|---|
| `npm run new-client -- --template T --slug S --name N ...` | Copies the template starter to `clients/S`, fills basics, makes placeholder images, starts the delivery timer |
| `npm run dev -- --client S` | Live preview (`--starter T` previews a template as it ships) |
| `npm run check` | Schema, assets, remote images, other-client leaks, placeholders-on-live, SEO and contrast checks |
| `npm run check:imports` | Static import and JSX check (no `node_modules` needed) |
| `npm test` | Unit tests for config, WhatsApp, cart, forms, SEO tags, checks and live verification |
| `npm run lint` | ESLint |
| `npm run build` | Checks, then Vite production build of every client and starter into `dist/`, then verifies the output |
| `npm run placeholders -- --client S` | Creates labelled placeholder images for anything referenced but missing |
| `npm run timing -- mark S <milestone>` / `report` | Records delivery milestones so improvement is measured |
| `npm run verify-live -- --client S [--url U]` | Checks a deployed site: pages, images, SEO tags |
| `npm run verify` | Everything above in order (this is what CI runs) |

## Templates

| Template | Status | For |
|---|---|---|
| `retail` | written, not yet built in CI | Boutiques, clothing, cosmetics, electronics, general retail |
| `hardware` | written, not yet built in CI | Hardware, building materials, electrical, tools, solar |
| `construction` | written, not yet built in CI | Builders, roofing, contractors, developers |
| `services`, `food`, `beauty`, `hospitality`, `automotive`, `realestate`, `education` | not started | Planned, in that order |

Existing live client sites are **not** touched or migrated by this repository.
