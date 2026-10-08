// Colour helpers. Pure functions, no dependencies, usable in the browser and in Node.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value) {
  return typeof value === "string" && HEX.test(value.trim());
}

export function hexToRgb(hex) {
  if (!isHexColor(hex)) return null;
  let h = hex.trim().slice(1);
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mix(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

// WCAG relative luminance
export function luminance([r, g, b]) {
  const ch = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const WHITE = [255, 255, 255];
const INK = [17, 24, 39];

export function readableOn(rgb) {
  return contrastRatio(rgb, WHITE) >= contrastRatio(rgb, INK) ? WHITE : INK;
}

const triplet = (rgb) => rgb.join(" ");

/**
 * An accessible version of the accent colour for use as TEXT on the page background:
 * blended towards the foreground colour until it reaches 4.5:1 contrast (WCAG AA).
 * A bright yellow accent stays yellow on dark sections but becomes a readable amber-brown on white.
 */
export function accentText(accent, bg, fg) {
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const c = mix(accent, fg, t);
    if (contrastRatio(c, bg) >= 4.5) return c;
  }
  return fg;
}

/**
 * Turn the brand block of a client config into CSS custom properties.
 * Tailwind reads these as rgb(var(--wv-x) / <alpha-value>) via the shared preset.
 */
export function buildThemeVars(brand) {
  const colors = brand?.colors ?? {};
  const bg = hexToRgb(colors.background ?? "#ffffff") ?? WHITE;
  const fg = hexToRgb(colors.foreground ?? "#111827") ?? INK;
  const primary = hexToRgb(colors.primary ?? "#111827") ?? INK;
  const accent = hexToRgb(colors.accent ?? "#b45309") ?? [180, 83, 9];
  const darkBg = luminance(bg) < 0.4;
  const card = darkBg ? mix(bg, WHITE, 0.06) : WHITE;

  const heading = brand?.fonts?.heading ?? "Inter";
  const body = brand?.fonts?.body ?? "Inter";
  const headingFallback = brand?.fonts?.headingSerif ? "ui-serif, Georgia, serif" : "ui-sans-serif, system-ui, sans-serif";

  return {
    "--wv-background": triplet(bg),
    "--wv-foreground": triplet(fg),
    "--wv-card": triplet(card),
    "--wv-primary": triplet(primary),
    "--wv-primary-foreground": triplet(readableOn(primary)),
    "--wv-accent": triplet(accent),
    "--wv-accent-foreground": triplet(readableOn(accent)),
    "--wv-accent-text": triplet(accentText(accent, bg, fg)),
    "--wv-muted": triplet(mix(bg, fg, 0.06)),
    "--wv-muted-foreground": triplet(mix(bg, fg, 0.62)),
    "--wv-border": triplet(mix(bg, fg, 0.14)),
    "--wv-radius": brand?.radius ?? "0.25rem",
    "--wv-font-heading": `"${heading}", ${headingFallback}`,
    "--wv-font-body": `"${body}", ui-sans-serif, system-ui, sans-serif`,
  };
}

/** Contrast problems a designer should know about (used by the checker). */
export function contrastWarnings(brand) {
  const colors = brand?.colors ?? {};
  const bg = hexToRgb(colors.background ?? "#ffffff");
  const fg = hexToRgb(colors.foreground ?? "#111827");
  const primary = hexToRgb(colors.primary ?? "");
  const out = [];
  if (bg && fg && contrastRatio(bg, fg) < 4.5) {
    out.push(`foreground on background contrast is ${contrastRatio(bg, fg).toFixed(2)}:1 (need 4.5:1)`);
  }
  if (bg && primary && contrastRatio(bg, primary) < 3) {
    out.push(`primary on background contrast is ${contrastRatio(bg, primary).toFixed(2)}:1 (need 3:1 for buttons and large text)`);
  }
  return out;
}
