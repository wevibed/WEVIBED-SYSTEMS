import { test } from "node:test";
import assert from "node:assert/strict";
import { validate, validateConfig, validateContent, buildThemeVars, contrastWarnings, hexToRgb, contrastRatio, accentText, googleFontsUrl, siteTitle } from "../packages/config/src/index.js";

const goodConfig = () => ({
  schemaVersion: 1,
  status: "draft",
  template: "retail",
  business: { name: "Acme Shoes", tagline: "Shoes for everyone", description: "Quality footwear for the whole family in Harare." },
  contact: { whatsapp: "263771234567", phoneDisplay: "077 123 4567", address: { line1: "1 Main St", city: "Harare", country: "Zimbabwe" } },
  brand: { logo: "/logo.svg", colors: { primary: "#111827", accent: "#b45309" }, fonts: { heading: "Inter", body: "Inter" } },
  hero: { image: "/hero.jpg", imageAlt: "Shop front", headline: "Shoes", subheadline: "For everyone" },
  seo: { domain: "acmeshoes.co.zw", ogImage: "/og.png" },
  currency: { code: "USD", symbol: "$" },
  deploy: { cloudflareProject: "acme-shoes" },
});

test("a complete config validates", () => {
  assert.deepEqual(validateConfig(goodConfig()), []);
});

test("missing required fields are reported with paths", () => {
  const c = goodConfig();
  delete c.contact.whatsapp;
  delete c.business.name;
  const paths = validateConfig(c).map((i) => i.path);
  assert.ok(paths.includes("contact.whatsapp"));
  assert.ok(paths.includes("business.name"));
});

test("unknown keys are rejected (typo protection)", () => {
  const c = goodConfig();
  c.contact.whatsap = "263771234567";
  assert.ok(validateConfig(c).some((i) => i.path === "contact.whatsap"));
});

test("whatsapp format rejects +, spaces and leading zero", () => {
  for (const bad of ["+263771234567", "0771234567", "263 77 123 4567", "12345"]) {
    const c = goodConfig();
    c.contact.whatsapp = bad;
    assert.ok(validateConfig(c).some((i) => i.path === "contact.whatsapp"), bad);
  }
});

test("domain must not include protocol; colours must be hex", () => {
  const c = goodConfig();
  c.seo.domain = "https://acme.co.zw";
  c.brand.colors.primary = "red";
  const paths = validateConfig(c).map((i) => i.path);
  assert.ok(paths.includes("seo.domain"));
  assert.ok(paths.includes("brand.colors.primary"));
});

test("endpoint mode requires an endpoint", () => {
  const c = goodConfig();
  c.forms = { mode: "endpoint" };
  assert.ok(validateConfig(c).some((i) => i.path === "forms.endpoint"));
  c.forms.endpoint = "https://formspree.io/f/abc";
  assert.deepEqual(validateConfig(c), []);
});

test("product content validates and catches duplicates", () => {
  const p = { id: "a-1", name: "A", category: "X", price: 5, image: "/a.jpg" };
  assert.deepEqual(validateContent("products", { items: [p] }), []);
  assert.ok(validateContent("products", { items: [p, { ...p }] }).some((i) => i.message === "duplicate id"));
  assert.ok(validateContent("products", { items: [{ ...p, price: -1 }] }).length > 0);
  assert.deepEqual(validateContent("products", { items: [{ ...p, price: null }] }), []);
});

test("unknown content file name is reported", () => {
  assert.equal(validateContent("nonsense", {}).length, 1);
});

test("validate handles type mismatches", () => {
  assert.equal(validate("x", { type: "number" }).length, 1);
  assert.equal(validate([], { type: "array", min: 1 }).length, 1);
});

test("theme vars: light and dark backgrounds, readable foregrounds", () => {
  const light = buildThemeVars({ colors: { primary: "#111827", accent: "#facc15" }, fonts: { heading: "Inter", body: "Inter" } });
  assert.equal(light["--wv-primary"], "17 24 39");
  assert.equal(light["--wv-primary-foreground"], "255 255 255"); // white on near-black
  assert.equal(light["--wv-accent-foreground"], "17 24 39"); // dark ink on yellow
  const dark = buildThemeVars({ colors: { primary: "#facc15", accent: "#facc15", background: "#0b0f14", foreground: "#f3f4f6" }, fonts: { heading: "Inter", body: "Inter" } });
  assert.notEqual(dark["--wv-card"], "255 255 255");
});

test("contrast helpers", () => {
  assert.ok(contrastRatio(hexToRgb("#000000"), hexToRgb("#ffffff")) > 20);
  assert.equal(contrastWarnings({ colors: { primary: "#111827", accent: "#b45309" } }).length, 0);
  assert.ok(contrastWarnings({ colors: { primary: "#f5f5f5", accent: "#b45309", background: "#ffffff", foreground: "#dddddd" } }).length >= 1);
});

test("google fonts url and title", () => {
  assert.equal(googleFontsUrl({ heading: "Barlow Condensed", body: "Inter" }), "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap");
  assert.equal(siteTitle(goodConfig()), "Acme Shoes — Shoes for everyone");
});

test("accent text colour is always readable on the page background", () => {
  const white = [255, 255, 255];
  const ink = [17, 24, 39];
  const yellow = hexToRgb("#f5b301");
  assert.ok(contrastRatio(yellow, white) < 2); // raw yellow on white is unreadable...
  assert.ok(contrastRatio(accentText(yellow, white, ink), white) >= 4.5); // ...the derived text colour is fine
  const dark = [11, 15, 20];
  assert.deepEqual(accentText(yellow, dark, [243, 244, 246]), yellow); // already readable on dark: unchanged
  const t = buildThemeVars({ colors: { primary: "#111827", accent: "#f5b301" }, fonts: { heading: "Inter", body: "Inter" } });
  assert.ok(t["--wv-accent-text"]);
});
