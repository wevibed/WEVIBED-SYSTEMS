# Client delivery workflow

Goal: shortest reliable path from "client agreed" to "live and verified". Each stage lists what to do,
what is automated, and the timing milestone to record (`npm run timing -- mark <slug> <milestone>`).
The clock starts at `agreed`; record it when the client says yes, before running `new-client`.

## 1. Requirements (ask once, in one message)

Send the client this list and collect it in a single round trip. Anything missing becomes a delay later.

- Business name as it should appear, one-line tagline, 1-2 sentence description
- WhatsApp number (the one customers should message), phone number if different, email, address, Google Maps link, opening hours
- Logo file (PNG/SVG), brand colours if they have them
- Photos: hero/storefront, and for each product / project / service (real photos only)
- Products with prices, or projects with location and type, or services with descriptions
- Facebook / Instagram / TikTok links, if any
- Domain: do they own one? Who controls its DNS?
- Any wording they must have (guarantees, delivery areas, payment methods)

Milestone: `agreed`, then `content-received` when the material above arrives.

## 2. Pick a template

| If the client mainly... | Template |
|---|---|
| sells products, with sizes/variants | `retail` |
| sells products by search/price list, trade customers, bulk | `hardware` |
| shows finished work and gets quotes | `construction` |

## 3. Create the client (automated)

```bash
npm run new-client -- --template <t> --slug <slug> --name "<Name>" --whatsapp <digits> --domain <domain>
```

Optionally pass `--intake docs/intake.example.json` (copy and fill it) to apply many config values at once.
This creates `clients/<slug>/`, labelled placeholder images, and starts the timer.

## 4. Fill in the content (the only genuinely client-specific work)

1. `client.config.json`: contact details, hours, social links, brand colours and fonts, hero text
2. `content/*.json`: products / projects / services / about / testimonials (see CLIENT-CONFIG.md)
3. `assets/`: real photos. Use the paths the JSON refers to, or change the JSON. Keep photos under about 600 KB (hero 1.2 MB); WebP or JPG
4. Delete a `content` item's `"placeholder": true` only after the client has confirmed that text or price
5. Do not invent testimonials. Delete `testimonials.json` if there are none

Preview as you go: `npm run dev -- --client <slug>`.

## 5. Check (automated)

`npm run check` fails on: invalid config, missing images, remote stock images, another client's name in
the copy, an SVG social-preview image, dummy phone numbers. It warns about placeholders still to replace,
low contrast, odd description length, and a phone number that doesn't match the WhatsApp number.
Fix errors; read warnings.

Push to GitHub. CI builds every client and template. Milestone: `first-green-build`.

## 6. Client approval

Deploy a preview first: **Actions → Deploy client**, client `<slug>`, branch `preview` (or `main` for the
`.pages.dev` address). While `status` is `draft` or `demo`, the site is `noindex` and robots.txt blocks crawlers.
Send the link. Milestone: `client-approved`.

## 7. Go live

1. Set `"status": "live"` in `client.config.json`. `npm run check` now blocks placeholders, dummy numbers and example domains
2. Deploy: **Actions → Deploy client → `<slug>`, branch `main`**. The workflow checks, tests, builds, deploys and verifies
3. Custom domain (manual, in Cloudflare): Pages project → Custom domains → add; confirm DNS and SSL
4. `npm run verify-live -- --client <slug>` against the real domain
5. Milestones: `deployed`, `dns-live`

## 8. Final verification checklist (human, 5 minutes, on a phone)

- [ ] Home loads; hero image sharp; text readable
- [ ] Menu opens and every link works
- [ ] WhatsApp button opens a chat with the right number and a sensible pre-filled message
- [ ] Contact form: submit it. WhatsApp opens with the message (or endpoint mode shows success)
- [ ] Open one product / project; open the gallery lightbox; use search and filters if present
- [ ] Cart (if enabled): add, change quantity, send order. Check the message in WhatsApp
- [ ] Share the link in WhatsApp: title, description and preview image appear
- [ ] Address, hours and phone numbers match what the client gave you
- [ ] Client has seen it on their own phone and approved

## 9. Handover

Give the client: the live URL, what to send you to change prices/photos, and who controls the domain.
Run `npm run timing -- report` and note where the time went; that is the data for the next improvement.
