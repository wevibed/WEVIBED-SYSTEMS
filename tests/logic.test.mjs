import { test } from "node:test";
import assert from "node:assert/strict";
import { waLink, normalizeNumber, buildEnquiryMessage, productEnquiryText } from "../packages/core/src/whatsapp.js";
import { validateFields } from "../packages/core/src/forms.js";
import { filterProducts, deriveCategories, tokenize } from "../packages/catalog/src/filter.js";
import { cartReducer, sanitizeCart, cartLines, cartTotals, buildCartMessage, priceText, formatMoney } from "../packages/catalog/src/cart.js";
import { buildHeadTags, buildJsonLd, buildSitemap, buildRobots, listPaths, safeJson } from "../packages/build/head.mjs";

test("waLink strips non-digits and encodes the message", () => {
  assert.equal(normalizeNumber("+263 77 123 4567"), "263771234567");
  assert.equal(waLink("263771234567", "Hi & bye"), "https://wa.me/263771234567?text=Hi%20%26%20bye");
  assert.equal(waLink("263771234567"), "https://wa.me/263771234567");
});

test("enquiry message uses the client's business name and skips empty fields", () => {
  const fields = [
    { name: "name", label: "Name" },
    { name: "phone", label: "Phone" },
    { name: "notes", label: "Notes" },
  ];
  const msg = buildEnquiryMessage({ businessName: "Acme Builders", subject: "I'd like a quote", fields, values: { name: " Tendai ", phone: "0771", notes: "" } });
  assert.equal(msg, "Hello Acme Builders, I'd like a quote.\n\nName: Tendai\nPhone: 0771");
  assert.ok(!/Sassy|Macrowan|Ngenaz/.test(msg));
});

test("product enquiry text", () => {
  const t = productEnquiryText({ businessName: "Acme", product: { name: "Heel" }, size: "38", priceText: "$15" });
  assert.equal(t, "Hello Acme, I'm interested in Heel (size 38) — $15. Is it available?");
});

test("form validation: required, phone, email", () => {
  const fields = [
    { name: "name", label: "Name", required: true },
    { name: "phone", label: "Phone", type: "tel", required: true },
    { name: "email", label: "Email", type: "email" },
  ];
  assert.deepEqual(validateFields(fields, { name: "A", phone: "0771234567", email: "" }), {});
  const errs = validateFields(fields, { name: " ", phone: "12", email: "nope" });
  assert.deepEqual(Object.keys(errs).sort(), ["email", "name", "phone"]);
});

const items = [
  { id: "a", name: "4-Plate Gas Stove", category: "Gas", keywords: "cooker oven", price: 125 },
  { id: "b", name: "Solar Panel 345W", category: "Solar", keywords: "photovoltaic", price: 50, badges: ["featured"] },
  { id: "c", name: "Gas Regulator", category: "Gas", price: null },
];

test("search is multi-word and category-aware", () => {
  assert.deepEqual(tokenize("  Gas   STOVE "), ["gas", "stove"]);
  assert.deepEqual(filterProducts(items, { query: "gas stove" }).map((p) => p.id), ["a"]);
  assert.deepEqual(filterProducts(items, { query: "photovoltaic" }).map((p) => p.id), ["b"]);
  assert.deepEqual(filterProducts(items, { category: "Gas" }).map((p) => p.id), ["a", "c"]);
  assert.deepEqual(filterProducts(items, { badge: "featured" }).map((p) => p.id), ["b"]);
  assert.deepEqual(filterProducts(items, { query: "zzz" }), []);
  assert.deepEqual(deriveCategories(items, ["Solar"]), ["Solar", "Gas"]);
});

test("cart reducer: add, merge sizes, quantity, remove, clear", () => {
  let s = [];
  s = cartReducer(s, { type: "add", id: "a" });
  s = cartReducer(s, { type: "add", id: "a" });
  s = cartReducer(s, { type: "add", id: "a", size: "38" });
  assert.equal(s.length, 2);
  assert.equal(s[0].qty, 2);
  s = cartReducer(s, { type: "setQty", key: "a|38", qty: 3 });
  assert.equal(s[1].qty, 3);
  s = cartReducer(s, { type: "setQty", key: "a", qty: 0 });
  assert.equal(s.length, 1);
  s = cartReducer(s, { type: "clear" });
  assert.deepEqual(s, []);
});

test("sanitizeCart rejects corrupted storage", () => {
  assert.deepEqual(sanitizeCart("x"), []);
  assert.deepEqual(sanitizeCart([{ key: "a", id: "a", qty: 2 }, { key: "b", id: "b", qty: -1 }, null, { id: 1 }]), [{ key: "a", id: "a", size: null, qty: 2 }]);
});

test("cart totals handle unpriced items and unknown ids", () => {
  const byId = Object.fromEntries(items.map((p) => [p.id, p]));
  const lines = cartLines([{ key: "a", id: "a", size: null, qty: 2 }, { key: "c", id: "c", size: null, qty: 1 }, { key: "x", id: "gone", size: null, qty: 1 }], byId);
  assert.equal(lines.length, 2);
  const t = cartTotals(lines);
  assert.deepEqual(t, { count: 3, pricedTotal: 250, unpricedCount: 1 });
  const msg = buildCartMessage({ businessName: "Acme Hardware", lines, symbol: "$" });
  assert.ok(msg.startsWith("Hello Acme Hardware"));
  assert.ok(msg.includes("1. 4-Plate Gas Stove — 2 × $125 = $250"));
  assert.ok(msg.includes("price to confirm"));
  assert.ok(msg.includes("some items need a price confirmed"));
});

test("price text", () => {
  assert.equal(priceText({ price: 19.5 }), "$19.50");
  assert.equal(priceText({ price: 1, unit: "per metre" }), "$1 per metre");
  assert.equal(priceText({ price: null }), "Enquire for price");
  assert.equal(priceText({ price: 8, priceLabel: "$8–$15" }), "$8–$15");
  assert.equal(formatMoney(10, "R"), "R10");
});

const cfg = {
  status: "live",
  business: { name: "Acme Shoes", tagline: "Shoes", description: "A good description of the business here." },
  contact: { whatsapp: "263771234567", phoneDisplay: "x", email: "a@b.co", address: { line1: "1 St", city: "Harare", country: "Zimbabwe" } },
  social: { facebook: "https://facebook.com/acme" },
  brand: { logo: "/logo.svg", colors: { primary: "#111827", accent: "#b45309" }, fonts: { heading: "Inter", body: "Inter" } },
  seo: { domain: "acmeshoes.co.zw", ogImage: "/og.png" },
};

test("head tags: SEO essentials present, canonical on the client's domain", () => {
  const tags = buildHeadTags(cfg);
  const find = (pred) => tags.find(pred);
  assert.equal(find((t) => t.tag === "title").children, "Acme Shoes — Shoes");
  assert.equal(find((t) => t.attrs?.rel === "canonical").attrs.href, "https://acmeshoes.co.zw/");
  assert.equal(find((t) => t.attrs?.property === "og:image").attrs.content, "https://acmeshoes.co.zw/og.png");
  assert.equal(find((t) => t.attrs?.name === "robots").attrs.content, "index,follow");
  assert.ok(find((t) => t.attrs?.type === "application/ld+json"));
  assert.ok(find((t) => t.tag === "style").children.includes("--wv-primary:17 24 39"));
});

test("non-live sites are noindex and disallowed in robots.txt", () => {
  const demo = { ...cfg, status: "demo" };
  assert.equal(buildHeadTags(demo).find((t) => t.attrs?.name === "robots").attrs.content, "noindex,nofollow");
  assert.equal(buildRobots(demo), "User-agent: *\nDisallow: /\n");
  assert.ok(buildRobots(cfg).includes("Sitemap: https://acmeshoes.co.zw/sitemap.xml"));
});

test("json-ld escapes script-closing sequences and carries contact data", () => {
  const ld = buildJsonLd({ ...cfg, business: { ...cfg.business, name: "</script><b>" } });
  assert.equal(ld.telephone, "+263771234567");
  assert.ok(!safeJson(ld).includes("</script>"));
});

test("sitemap lists static and dynamic routes", () => {
  const meta = { routes: ["/", "/shop", "/product/:id"], dynamicRoutes: [{ pattern: "/product/:id", content: "products", list: "items", param: "id" }] };
  const paths = listPaths(meta, { products: { items: [{ id: "a" }, { id: "b" }] } });
  assert.deepEqual(paths, ["/", "/product/a", "/product/b", "/shop"]);
  const xml = buildSitemap(cfg, paths, "2026-10-04");
  assert.ok(xml.includes("<loc>https://acmeshoes.co.zw/product/a</loc>"));
});
