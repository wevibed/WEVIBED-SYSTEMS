// Pure builders for everything that must exist in the static HTML for SEO and sharing.
import { buildThemeVars, siteTitle, siteUrl, absoluteUrl, googleFontsUrl } from "../config/src/index.js";

const escAttr = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** JSON for embedding in <script>: neutralise sequences that could close the tag. */
export function safeJson(obj) {
  return JSON.stringify(obj)
    .replace(/</g, "\\u003c")
    .replace(new RegExp(String.fromCharCode(0x2028), "g"), "\\u2028")
    .replace(new RegExp(String.fromCharCode(0x2029), "g"), "\\u2029");
}

export function buildJsonLd(config) {
  const a = config.contact.address;
  const ld = {
    "@context": "https://schema.org",
    "@type": config.business.schemaType || "LocalBusiness",
    name: config.business.name,
    description: config.business.description,
    url: siteUrl(config),
    telephone: `+${config.contact.phone ?? config.contact.whatsapp}`,
    image: absoluteUrl(config, config.seo.ogImage),
    address: {
      "@type": "PostalAddress",
      streetAddress: [a.line1, a.line2].filter(Boolean).join(", "),
      addressLocality: a.city,
      addressCountry: a.country,
    },
  };
  if (config.contact.email) ld.email = config.contact.email;
  const sameAs = Object.values(config.social ?? {}).filter(Boolean);
  if (sameAs.length) ld.sameAs = sameAs;
  return ld;
}

/** Head tags in Vite's transformIndexHtml tag format. */
export function buildHeadTags(config) {
  const title = siteTitle(config);
  const url = siteUrl(config);
  const ogImage = absoluteUrl(config, config.seo.ogImage);
  const live = config.status === "live";
  const themeVars = buildThemeVars(config.brand);
  const cssVars = `:root{${Object.entries(themeVars).map(([k, v]) => `${k}:${v}`).join(";")}}`;
  const fontsUrl = googleFontsUrl(config.brand.fonts);

  const meta = (attrs) => ({ tag: "meta", attrs, injectTo: "head" });
  const tags = [
    { tag: "title", children: title, injectTo: "head" },
    meta({ name: "description", content: config.business.description }),
    meta({ name: "theme-color", content: config.brand.colors.primary }),
    meta({ name: "robots", content: live ? "index,follow" : "noindex,nofollow" }),
    { tag: "link", attrs: { rel: "canonical", href: `${url}/` }, injectTo: "head" },
    { tag: "link", attrs: { rel: "icon", href: config.brand.logo }, injectTo: "head" },
    meta({ property: "og:type", content: "website" }),
    meta({ property: "og:site_name", content: config.business.name }),
    meta({ property: "og:title", content: title }),
    meta({ property: "og:description", content: config.business.description }),
    meta({ property: "og:url", content: `${url}/` }),
    meta({ property: "og:image", content: ogImage }),
    meta({ name: "twitter:card", content: "summary_large_image" }),
    meta({ name: "twitter:title", content: title }),
    meta({ name: "twitter:description", content: config.business.description }),
    meta({ name: "twitter:image", content: ogImage }),
    { tag: "style", children: cssVars, injectTo: "head" },
    { tag: "script", attrs: { type: "application/ld+json" }, children: safeJson(buildJsonLd(config)), injectTo: "head" },
  ];
  if (fontsUrl) {
    tags.push({ tag: "link", attrs: { rel: "preconnect", href: "https://fonts.googleapis.com" }, injectTo: "head" });
    tags.push({ tag: "link", attrs: { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }, injectTo: "head" });
    tags.push({ tag: "link", attrs: { rel: "stylesheet", href: fontsUrl }, injectTo: "head" });
  }
  return tags;
}

/** Expand template.json dynamicRoutes against content to get every static URL path. */
export function listPaths(templateMeta, content) {
  const paths = new Set();
  for (const r of templateMeta.routes ?? []) {
    if (!r.includes(":")) paths.add(r);
  }
  for (const dr of templateMeta.dynamicRoutes ?? []) {
    const items = content?.[dr.content]?.[dr.list] ?? [];
    for (const item of items) paths.add(dr.pattern.replace(`:${dr.param}`, encodeURIComponent(item[dr.param])));
  }
  return [...paths].sort();
}

export function buildSitemap(config, paths, lastmod) {
  const base = siteUrl(config);
  const urls = paths
    .map((p) => `  <url><loc>${escAttr(base + p)}</loc><lastmod>${lastmod}</lastmod></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function buildRobots(config) {
  if (config.status !== "live") return "User-agent: *\nDisallow: /\n";
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl(config)}/sitemap.xml\n`;
}

export function buildHeaders() {
  return [
    "/*",
    "  X-Content-Type-Options: nosniff",
    "  X-Frame-Options: SAMEORIGIN",
    "  Referrer-Policy: strict-origin-when-cross-origin",
    "  Permissions-Policy: camera=(), microphone=(), geolocation=()",
    "",
    "/assets/*",
    "  Cache-Control: public, max-age=31536000, immutable",
    "",
  ].join("\n");
}
