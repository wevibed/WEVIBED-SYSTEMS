// Post-deployment verification against a live URL. `fetchImpl` is injectable so the logic is unit-tested
// with a fake server; the CLI passes the real global fetch.
import { siteTitle } from "../config/src/index.js";
import { collectAssetRefs } from "./refs.mjs";
import { listPaths } from "./head.mjs";

export async function verifyLive({ baseUrl, config, content, template, fetchImpl = fetch, maxPaths = 25 }) {
  const base = baseUrl.replace(/\/$/, "");
  const results = [];
  const add = (name, ok, detail = "") => results.push({ name, ok, detail });

  const get = async (p, init) => {
    try {
      const res = await fetchImpl(`${base}${p}`, { redirect: "follow", ...init });
      return res;
    } catch (e) {
      return { ok: false, status: 0, error: e.message, headers: { get: () => "" }, text: async () => "" };
    }
  };

  const home = await get("/");
  const html = home.ok ? await home.text() : "";
  add("home page responds 200", home.status === 200, home.status ? `status ${home.status}` : home.error);
  if (home.status === 200) {
    add("title matches client config", html.includes(`<title>${siteTitle(config)}</title>`), siteTitle(config));
    const wantRobots = config.status === "live" ? "index,follow" : "noindex,nofollow";
    add(`robots meta is ${wantRobots}`, html.includes(`content="${wantRobots}"`));
    add("canonical points at the client domain", html.includes(`href="https://${config.seo.domain}/"`));
    add("structured data present", html.includes("application/ld+json"));
  }

  const og = await get(config.seo.ogImage);
  add("Open Graph image loads", og.status === 200 && /^image\//.test(og.headers.get("content-type") ?? ""), `${config.seo.ogImage} → ${og.status}`);

  const robots = await get("/robots.txt");
  add("robots.txt loads", robots.status === 200);
  const sitemap = await get("/sitemap.xml");
  const sitemapText = sitemap.status === 200 ? await sitemap.text() : "";
  add("sitemap.xml loads and names the client domain", sitemap.status === 200 && sitemapText.includes(config.seo.domain));

  const assetPaths = [...new Set(collectAssetRefs(config, content).map((r) => r.path))];
  const brokenAssets = [];
  for (const p of assetPaths) {
    const res = await get(p, { method: "GET" });
    if (res.status !== 200) brokenAssets.push(`${p} (${res.status})`);
  }
  add(`all ${assetPaths.length} images load`, brokenAssets.length === 0, brokenAssets.slice(0, 5).join(", "));

  const paths = listPaths(template, content).slice(0, maxPaths);
  const brokenPages = [];
  for (const p of paths) {
    const res = await get(p);
    if (res.status !== 200) brokenPages.push(`${p} (${res.status})`);
  }
  add(`${paths.length} page routes respond 200`, brokenPages.length === 0, brokenPages.slice(0, 5).join(", "));

  return { ok: results.every((r) => r.ok), results };
}
