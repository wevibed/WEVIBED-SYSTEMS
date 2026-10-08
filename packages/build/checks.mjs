// Pre-build and post-build quality checks. Pure Node, no dependencies, so they run before `npm install`.
// Each finding is { code, message }. Errors block a build; warnings are reported.
import fs from "node:fs";
import path from "node:path";
import { contrastWarnings, validateConfig, validateContent } from "../config/src/index.js";
import { loadClient, readTemplateMeta, ROOT, TEMPLATES_DIR } from "./load-client.mjs";
import { collectAssetRefs, collectStrings, countPlaceholderItems } from "./refs.mjs";
import { readImageSize } from "./image-info.mjs";
import { isPlaceholderFile } from "./placeholders.mjs";
import { listPaths } from "./head.mjs";

const STOCK_HOSTS = /(images\.pexels\.com|images\.unsplash\.com|source\.unsplash\.com|picsum\.photos|placehold\.co|via\.placeholder\.com|placekitten|dummyimage)/i;
const UNFILLED = /\b(TODO|TBD|REPLACE[_ -]?ME|lorem ipsum)\b/i;
const FAKE_NUMBER = /0{6,}/;
const BYTES = { image: 600 * 1024, hero: 1200 * 1024 };

export function loadLeakTerms() {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, "tools/leak-terms.json"), "utf8")).terms ?? [];
  } catch {
    return [];
  }
}

const digits = (s) => String(s ?? "").replace(/\D/g, "");

/** Check one client folder or template starter. */
export function runChecks({ dir, kind, name, leakTerms = loadLeakTerms() }) {
  const errors = [];
  const warnings = [];
  const err = (code, message) => errors.push({ code, message });
  const warn = (code, message) => warnings.push({ code, message });

  const loaded = loadClient(dir);
  for (const e of loaded.errors) err("parse", `${e.file}: ${e.message}`);
  if (!loaded.config) return { errors, warnings, stats: {} };
  const { config, content } = loaded;

  // 1. Schema
  for (const i of validateConfig(config)) err("config", `client.config.json ${i.path}: ${i.message}`);
  for (const [n, body] of Object.entries(content)) {
    for (const i of validateContent(n, body)) err("content", `content/${n}.json ${i.path}: ${i.message}`);
  }
  const schemaBroken = errors.length > 0;

  // 2. Template contract
  const template = readTemplateMeta(config.template);
  if (!template) {
    err("template", `template "${config.template}" not found (templates/${config.template}/template.json)`);
  } else {
    if (kind === "starter" && name !== `starter-${config.template}`) err("template", `starter "${name}" declares template "${config.template}"`);
    for (const req of template.content?.required ?? []) {
      if (!content[req]) err("content-missing", `content/${req}.json is required by template "${config.template}"`);
    }
    const routes = new Set(template.routes ?? []);
    for (const item of config.nav ?? []) {
      if (item.to?.startsWith("/") && !routes.has(item.to)) err("nav", `nav item "${item.label}" points to "${item.to}", which template "${config.template}" does not have`);
    }
  }

  // 3. Assets exist, formats and sizes sensible
  const assetsRoot = path.join(dir, "assets");
  const refs = collectAssetRefs(config, content);
  const seen = new Set();
  let placeholderAssets = 0;
  for (const ref of refs) {
    const file = path.join(assetsRoot, ref.path);
    if (!fs.existsSync(file)) {
      err("asset-missing", `${ref.where} → ${ref.path} does not exist in assets/`);
      continue;
    }
    if (seen.has(ref.path)) continue;
    seen.add(ref.path);
    if (isPlaceholderFile(file)) placeholderAssets += 1;
    const bytes = fs.statSync(file).size;
    const limit = /hero|og/i.test(ref.path) ? BYTES.hero : BYTES.image;
    if (bytes > limit && !/\.svg$/i.test(ref.path)) warn("image-heavy", `${ref.path} is ${(bytes / 1024).toFixed(0)} KB (aim for under ${Math.round(limit / 1024)} KB)`);
  }
  const ogPath = config.seo?.ogImage;
  if (ogPath) {
    if (/\.svg$/i.test(ogPath)) err("og-format", `seo.ogImage ${ogPath} is an SVG; Facebook/WhatsApp/X do not show SVG previews. Use a 1200x630 PNG or JPG`);
    else {
      const size = readImageSize(path.join(assetsRoot, ogPath));
      if (size && (size.width < 1200 || size.height < 600)) warn("og-size", `seo.ogImage is ${size.width}x${size.height}; 1200x630 gives sharp link previews`);
    }
  }
  const heroSize = config.hero?.image ? readImageSize(path.join(assetsRoot, config.hero.image)) : null;
  if (heroSize && heroSize.width < 1200) warn("hero-size", `hero image is only ${heroSize.width}px wide; it will look soft on large screens`);

  // 4. No remote stock images, no leftovers
  const strings = collectStrings(config, content);
  for (const s of strings) {
    if (STOCK_HOSTS.test(s.text)) err("remote-image", `${s.where} uses a remote stock/placeholder image (${s.text.slice(0, 60)}). Download it into assets/ or replace it with a real photo`);
  }
  const unfilled = strings.filter((s) => UNFILLED.test(s.text));
  const status = config.status;
  for (const s of unfilled) (status === "live" ? err : warn)("unfilled", `${s.where} still contains a TODO/placeholder marker`);

  // 5. Leaks from other clients
  const own = String(config.business?.name ?? "").toLowerCase();
  const haystack = strings.map((s) => s.text.toLowerCase());
  for (const term of leakTerms) {
    if (own.includes(term)) continue;
    const hit = strings.find((_, i) => haystack[i].includes(term));
    if (hit) err("leak", `${hit.where} mentions "${term}", which belongs to another client`);
  }

  // 6. Placeholders must not go live
  const placeholderItems = countPlaceholderItems(content);
  const whatsapp = config.contact?.whatsapp ?? "";
  const domain = config.seo?.domain ?? "";
  const fakeNumber = FAKE_NUMBER.test(whatsapp);
  const fakeDomain = /(^|\.)example(\.[a-z]+)?$/i.test(domain);
  if (status === "live") {
    if (placeholderAssets) err("placeholder-live", `${placeholderAssets} placeholder image(s) remain; replace them before going live`);
    if (placeholderItems) err("placeholder-live", `${placeholderItems} content item(s) are flagged placeholder: true (unverified prices/text); confirm with the client and remove the flag`);
    if (fakeNumber) err("placeholder-live", `contact.whatsapp "${whatsapp}" looks like a dummy number`);
    if (fakeDomain) err("placeholder-live", `seo.domain "${domain}" is an example domain`);
  } else if (kind === "client") {
    if (placeholderAssets) warn("placeholder", `${placeholderAssets} placeholder image(s) still to replace`);
    if (placeholderItems) warn("placeholder", `${placeholderItems} content item(s) flagged placeholder: true still to confirm with the client`);
    if (fakeNumber) warn("placeholder", `contact.whatsapp "${whatsapp}" looks like a dummy number`);
  }

  // 7. Consistency and SEO hygiene
  if (!schemaBroken) {
    for (const w of contrastWarnings(config.brand)) warn("contrast", w);
    const dLen = config.business.description.length;
    if (dLen < 70 || dLen > 160) warn("seo-description", `business.description is ${dLen} characters; 70-160 displays best in search results`);
    const display = digits(config.contact.phoneDisplay);
    const numberToMatch = digits(config.contact.phone ?? config.contact.whatsapp);
    if (display.length >= 9 && !fakeNumber && !numberToMatch.endsWith(display.slice(-9))) {
      warn("phone-mismatch", `contact.phoneDisplay (${config.contact.phoneDisplay}) does not match the ${config.contact.phone ? "phone" : "whatsapp"} number ${numberToMatch}`);
    }
    if (config.forms?.mode === "endpoint" && !/^https:/.test(config.forms.endpoint)) err("forms", "forms.endpoint must be https");
  }

  return { errors, warnings, stats: { assets: seen.size, placeholderAssets, placeholderItems } };
}

/** Scan shared source and templates for names of existing clients. Run once per `check --all`. */
export function checkSourceLeaks({ leakTerms = loadLeakTerms() } = {}) {
  const errors = [];
  const roots = [path.join(ROOT, "packages"), TEMPLATES_DIR].filter((p) => fs.existsSync(p));
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules") walk(full);
      } else if (/\.(jsx?|mjs|json|html|css|md)$/.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8").toLowerCase();
        for (const term of leakTerms) {
          if (text.includes(term)) errors.push({ code: "source-leak", message: `${path.relative(ROOT, full)} mentions "${term}"` });
        }
      }
    }
  };
  roots.forEach(walk);
  return errors;
}

/** Post-build verification of a template build output. */
export function checkBuilt({ distDir, config, content, template }) {
  const errors = [];
  const err = (code, message) => errors.push({ code, message });
  const indexFile = path.join(distDir, "index.html");
  if (!fs.existsSync(indexFile)) return [{ code: "built", message: "dist/index.html was not produced" }];
  const html = fs.readFileSync(indexFile, "utf8");

  const must = [
    ["<title>", "title tag"],
    ['name="description"', "meta description"],
    ['rel="canonical"', "canonical link"],
    ['property="og:image"', "Open Graph image"],
    ['property="og:title"', "Open Graph title"],
    ["application/ld+json", "JSON-LD structured data"],
    ["--wv-primary", "theme variables"],
    ['id="root"', "app root"],
  ];
  for (const [needle, label] of must) if (!html.includes(needle)) err("built-seo", `built index.html is missing ${label}`);
  if (/localhost|127\.0\.0\.1/.test(html)) err("built-seo", "built index.html references localhost");

  for (const f of ["robots.txt", "sitemap.xml", "_headers"]) {
    if (!fs.existsSync(path.join(distDir, f))) err("built-files", `${f} missing from build output`);
  }
  const robots = fs.existsSync(path.join(distDir, "robots.txt")) ? fs.readFileSync(path.join(distDir, "robots.txt"), "utf8") : "";
  if (config.status !== "live" && !/Disallow: \//.test(robots)) err("built-robots", "non-live site must disallow crawling in robots.txt");
  if (config.status === "live" && /Disallow: \/\s*$/m.test(robots)) err("built-robots", "live site must not disallow crawling");

  for (const ref of collectAssetRefs(config, content)) {
    if (!fs.existsSync(path.join(distDir, ref.path))) err("built-assets", `${ref.path} (${ref.where}) missing from build output`);
  }
  const assetsDir = path.join(distDir, "assets");
  const hasJs = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).some((f) => f.endsWith(".js"));
  const hasCss = fs.existsSync(assetsDir) && fs.readdirSync(assetsDir).some((f) => f.endsWith(".css"));
  if (!hasJs) err("built-files", "no JavaScript bundle in dist/assets");
  if (!hasCss) err("built-files", "no CSS bundle in dist/assets");

  const sitemap = fs.existsSync(path.join(distDir, "sitemap.xml")) ? fs.readFileSync(path.join(distDir, "sitemap.xml"), "utf8") : "";
  for (const p of listPaths(template, content)) {
    if (!sitemap.includes(`${config.seo.domain}${p}</loc>`) && !sitemap.includes(`${config.seo.domain}${p.replace(/&/g, "&amp;")}</loc>`)) err("built-sitemap", `sitemap.xml is missing ${p}`);
  }
  return errors;
}
