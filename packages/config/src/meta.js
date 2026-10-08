// Small pure helpers shared by the build plugin (Node) and the runtime (browser).

export function siteTitle(config) {
  return `${config.business.name} — ${config.business.tagline}`;
}

export function siteUrl(config) {
  return `https://${config.seo.domain}`;
}

export function absoluteUrl(config, assetPath) {
  return `${siteUrl(config)}${assetPath}`;
}

const SAFE_WEIGHTS = "400;500;600;700";

/** Google Fonts CSS URL for the heading and body fonts, or null if none. */
export function googleFontsUrl(fonts) {
  const names = [...new Set([fonts?.heading, fonts?.body].filter(Boolean))];
  if (!names.length) return null;
  const families = names.map((n) => `family=${encodeURIComponent(n).replace(/%20/g, "+")}:wght@${SAFE_WEIGHTS}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}
