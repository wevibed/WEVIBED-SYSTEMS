import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { listTemplates, loadClient, readTemplateMeta, ROOT, TEMPLATES_DIR } from "../packages/build/load-client.mjs";
import { runChecks, checkBuilt, checkSourceLeaks } from "../packages/build/checks.mjs";
import { makePng, isPlaceholderFile, generatePlaceholders } from "../packages/build/placeholders.mjs";
import { readImageSizeFromBuffer } from "../packages/build/image-info.mjs";
import { verifyLive } from "../packages/build/live-checks.mjs";
import { checkImports } from "../packages/build/imports-check.mjs";
import { buildHeadTags, buildRobots, buildSitemap, listPaths } from "../packages/build/head.mjs";

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), "wv-test-"));
const starterDir = (t) => path.join(TEMPLATES_DIR, t, "starter");
const copyStarter = (t) => {
  const dest = path.join(tmp(), "client");
  fs.cpSync(starterDir(t), dest, { recursive: true });
  return dest;
};
const editConfig = (dir, fn) => {
  const file = path.join(dir, "client.config.json");
  const cfg = JSON.parse(fs.readFileSync(file, "utf8"));
  fn(cfg);
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
};
const codes = (r) => r.errors.map((e) => e.code);

test("the first three templates exist and each has a valid, check-clean starter", () => {
  const templates = listTemplates();
  for (const t of ["retail", "hardware", "construction"]) {
    assert.ok(templates.includes(t), `template ${t} missing`);
    const r = runChecks({ dir: starterDir(t), kind: "starter", name: `starter-${t}` });
    assert.deepEqual(r.errors, [], `${t}: ${JSON.stringify(r.errors)}`);
  }
});

test("shared source contains no names of existing clients", () => {
  assert.deepEqual(checkSourceLeaks(), []);
});

test("every template's declared routes match its App routes", () => {
  for (const t of listTemplates()) {
    const meta = readTemplateMeta(t);
    const app = fs.readFileSync(path.join(TEMPLATES_DIR, t, "src/App.jsx"), "utf8");
    for (const r of meta.routes) assert.ok(app.includes(`path="${r}"`), `${t}: route ${r} not in App.jsx`);
    for (const m of app.matchAll(/path="([^"*]+)"/g)) assert.ok(meta.routes.includes(m[1]), `${t}: App.jsx route ${m[1]} not declared in template.json`);
  }
});

test("check catches a missing image", () => {
  const dir = copyStarter("retail");
  fs.rmSync(path.join(dir, "assets/hero.svg"));
  assert.ok(codes(runChecks({ dir, kind: "client", name: "x" })).includes("asset-missing"));
});

test("check rejects remote stock images", () => {
  const dir = copyStarter("hardware");
  const file = path.join(dir, "content/products.json");
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.items[0].description = "see https://images.unsplash.com/photo-1 for the look";
  fs.writeFileSync(file, JSON.stringify(data));
  assert.ok(codes(runChecks({ dir, kind: "client", name: "x" })).includes("remote-image"));
});

test("check catches another client's name left in the copy", () => {
  const dir = copyStarter("retail");
  editConfig(dir, (c) => {
    c.business.tagline = "Sassy Lady Shoes for everyone";
  });
  const r = runChecks({ dir, kind: "client", name: "x" });
  assert.ok(codes(r).includes("leak"));
  // ...but a client may use its own name
  editConfig(dir, (c) => {
    c.business.name = "Sassy Lady Shoes";
  });
  assert.ok(!codes(runChecks({ dir, kind: "client", name: "x" })).includes("leak"));
});

test("a site cannot go live with placeholders, dummy phone numbers or example domains", () => {
  const dir = copyStarter("construction");
  assert.ok(!codes(runChecks({ dir, kind: "client", name: "x" })).includes("placeholder-live")); // demo is fine
  editConfig(dir, (c) => {
    c.status = "live";
  });
  const r = runChecks({ dir, kind: "client", name: "x" });
  const msgs = r.errors.filter((e) => e.code === "placeholder-live").map((e) => e.message).join(" | ");
  assert.match(msgs, /placeholder image/);
  assert.match(msgs, /placeholder: true/);
  assert.match(msgs, /dummy number/);
  assert.match(msgs, /example domain/);
});

test("check rejects an SVG social preview image, unknown nav routes and missing required content", () => {
  const dir = copyStarter("retail");
  editConfig(dir, (c) => {
    c.seo.ogImage = "/logo.svg";
    c.nav = [{ label: "Pricing", to: "/pricing" }];
  });
  fs.rmSync(path.join(dir, "content/about.json"));
  const c = codes(runChecks({ dir, kind: "client", name: "x" }));
  for (const expected of ["og-format", "nav", "content-missing"]) assert.ok(c.includes(expected), expected);
});

test("check reports schema problems with the file and path", () => {
  const dir = copyStarter("retail");
  editConfig(dir, (c) => {
    c.contact.whatsapp = "+263 77 000 0000";
  });
  const r = runChecks({ dir, kind: "client", name: "x" });
  assert.ok(r.errors.some((e) => e.message.includes("contact.whatsapp")));
});

test("phone display that disagrees with the WhatsApp number is flagged", () => {
  const dir = copyStarter("retail");
  editConfig(dir, (c) => {
    c.contact.whatsapp = "263771234567";
    c.contact.phoneDisplay = "077 765 4321";
  });
  const r = runChecks({ dir, kind: "client", name: "x" });
  assert.ok(r.warnings.some((w) => w.code === "phone-mismatch"));
});

test("placeholder generation: PNG header, markers, and no overwrite of real files", () => {
  const png = makePng(1200, 630, [200, 210, 220]);
  assert.deepEqual(readImageSizeFromBuffer(png), { type: "png", width: 1200, height: 630 });
  const dir = copyStarter("retail");
  const real = path.join(dir, "assets/hero.svg");
  fs.writeFileSync(real, "<svg xmlns='http://www.w3.org/2000/svg'/>");
  fs.rmSync(path.join(dir, "assets/og.png"));
  const { config, content } = loadClient(dir);
  const out = generatePlaceholders({ dir, config, content });
  assert.deepEqual(out.created, ["/og.png"]);
  assert.equal(isPlaceholderFile(path.join(dir, "assets/og.png")), true);
  assert.equal(isPlaceholderFile(real), false);
});

test("JPEG dimensions are read from the SOF marker", () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x04, 0xb0, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xd9]);
  assert.deepEqual(readImageSizeFromBuffer(jpeg), { type: "jpeg", width: 1200, height: 600 });
});

function fakeDist({ withSeo = true } = {}) {
  const dist = tmp();
  const dir = starterDir("retail");
  const { config, content } = loadClient(dir);
  const template = readTemplateMeta("retail");
  fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
  fs.writeFileSync(path.join(dist, "assets/index.js"), "x");
  fs.writeFileSync(path.join(dist, "assets/index.css"), "x");
  const head = withSeo
    ? buildHeadTags(config).map((t) => (t.tag === "title" ? "<title>t</title>" : t.tag === "style" ? `<style>${t.children}</style>` : t.attrs?.rel === "canonical" ? '<link rel="canonical" href="x">' : t.attrs?.property === "og:image" ? '<meta property="og:image" content="x">' : t.attrs?.property === "og:title" ? '<meta property="og:title" content="x">' : t.attrs?.name === "description" ? '<meta name="description" content="x">' : t.attrs?.type === "application/ld+json" ? '<script type="application/ld+json">{}</script>' : "")).join("")
    : "";
  fs.writeFileSync(path.join(dist, "index.html"), `<html><head>${head}</head><body><div id="root"></div></body></html>`);
  fs.writeFileSync(path.join(dist, "robots.txt"), buildRobots(config));
  fs.writeFileSync(path.join(dist, "_headers"), "/*");
  fs.writeFileSync(path.join(dist, "sitemap.xml"), buildSitemap(config, listPaths(template, content), "2026-01-01"));
  fs.cpSync(path.join(dir, "assets"), dist, { recursive: true });
  return { dist, config, content, template };
}

test("post-build check passes a complete output and fails an incomplete one", () => {
  const good = fakeDist();
  assert.deepEqual(checkBuilt({ distDir: good.dist, config: good.config, content: good.content, template: good.template }), []);
  const bad = fakeDist({ withSeo: false });
  const problems = checkBuilt({ distDir: bad.dist, config: bad.config, content: bad.content, template: bad.template });
  assert.ok(problems.some((p) => p.message.includes("canonical")));
  fs.rmSync(path.join(bad.dist, "sitemap.xml"));
  assert.ok(checkBuilt({ distDir: bad.dist, config: bad.config, content: bad.content, template: bad.template }).some((p) => p.code === "built-files"));
});

test("a non-live build must disallow crawling", () => {
  const { dist, config, content, template } = fakeDist();
  fs.writeFileSync(path.join(dist, "robots.txt"), "User-agent: *\nAllow: /\n");
  assert.ok(checkBuilt({ distDir: dist, config, content, template }).some((p) => p.code === "built-robots"));
});

test("live verification works against a fake server, and reports failures", async () => {
  const dir = starterDir("hardware");
  const { config, content } = loadClient(dir);
  const template = readTemplateMeta("hardware");
  const title = `<title>${config.business.name} — ${config.business.tagline}</title>`;
  const html = `<html><head>${title}<meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://${config.seo.domain}/"><script type="application/ld+json">{}</script></head></html>`;
  const make = (broken = []) => async (url) => {
    const p = new URL(url).pathname;
    const res = (status, body = "", type = "text/html") => ({ status, ok: status < 400, headers: { get: () => type }, text: async () => body });
    if (broken.includes(p)) return res(404);
    if (p === "/sitemap.xml") return res(200, `<loc>https://${config.seo.domain}/</loc>`, "application/xml");
    if (p === "/robots.txt") return res(200, "User-agent: *", "text/plain");
    if (/\.(svg|png)$/.test(p)) return res(200, "", p.endsWith(".png") ? "image/png" : "image/svg+xml");
    return res(200, html);
  };
  const ok = await verifyLive({ baseUrl: "https://x.pages.dev", config, content, template, fetchImpl: make() });
  assert.deepEqual(ok.results.filter((r) => !r.ok), []);
  assert.equal(ok.ok, true);
  const bad = await verifyLive({ baseUrl: "https://x.pages.dev", config, content, template, fetchImpl: make(["/og.png", "/products"]) });
  assert.equal(bad.ok, false);
  const failed = bad.results.filter((r) => !r.ok).map((r) => r.name);
  assert.ok(failed.some((n) => n.includes("Open Graph")));
  assert.ok(failed.some((n) => n.includes("page routes")));
});

test("import checker finds unresolved imports, missing exports, unknown packages and undefined JSX components", () => {
  const root = tmp();
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ dependencies: { react: "1" } }));
  fs.mkdirSync(path.join(root, "packages/core/src"), { recursive: true });
  fs.mkdirSync(path.join(root, "templates/t/src"), { recursive: true });
  fs.writeFileSync(path.join(root, "packages/core/src/index.js"), 'export { A } from "./a.jsx";\nexport const helper = 1;\n');
  fs.writeFileSync(path.join(root, "packages/core/src/a.jsx"), "export function A() { return null; }\n");
  fs.writeFileSync(
    path.join(root, "templates/t/src/Page.jsx"),
    ['import { A, Nope } from "@wevibed/core";', 'import x from "./missing.js";', 'import q from "left-pad";', 'import { useState } from "react";', "export default function P() { return <div><A /><Ghost /></div>; }"].join("\n"),
  );
  const found = checkImports({ root, dirs: ["packages", "templates"] }).map((p) => p.code).sort();
  assert.deepEqual(found, ["jsx-undefined", "missing-export", "package-missing", "unresolved"]);
});

test("the real repository passes the import check", () => {
  assert.deepEqual(checkImports({ root: ROOT }), []);
});
