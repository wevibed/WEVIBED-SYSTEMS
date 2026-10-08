// Generates clearly-labelled placeholder images so a new client site builds and looks complete
// before the real photos arrive. Placeholders carry a marker, and `check` refuses to let a site
// go live while any remain.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { hexToRgb, mix } from "../config/src/index.js";
import { collectAssetRefs } from "./refs.mjs";

export const PLACEHOLDER_SVG_MARKER = 'data-wv-placeholder="true"';
export const PLACEHOLDER_PNG_MARKER = "wv-placeholder";

const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Solid-colour PNG with a text chunk marking it as a placeholder. */
export function makePng(width, height, [r, g, b]) {
  const row = Buffer.alloc(1 + width * 3);
  for (let x = 0; x < width; x += 1) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const raw = Buffer.concat(Array.from({ length: height }, () => row));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("tEXt", Buffer.from(`${PLACEHOLDER_PNG_MARKER}\0true`, "latin1")),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const xml = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

export function placeholderSvg({ width, height, label, tone, ink }) {
  const big = Math.max(18, Math.round(Math.min(width, height) / 14));
  const small = Math.max(12, Math.round(big / 2.2));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Placeholder image" ${PLACEHOLDER_SVG_MARKER}>
  <rect width="100%" height="100%" fill="${tone}"/>
  <path d="M0 0L${width} ${height}M${width} 0L0 ${height}" stroke="${ink}" stroke-opacity="0.12" stroke-width="2"/>
  <text x="50%" y="47%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${big}" font-weight="700" letter-spacing="4" fill="${ink}" fill-opacity="0.65">PLACEHOLDER</text>
  <text x="50%" y="${Math.round(47 + (small / height) * 220)}%" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${small}" fill="${ink}" fill-opacity="0.55">${xml(label)}</text>
</svg>
`;
}

export function initials(name) {
  const letters = String(name).split(/\s+/).filter(Boolean).map((w) => w[0]).join("").toUpperCase();
  return (letters.slice(0, 2) || "WV").replace(/[^A-Z0-9]/g, "") || "WV";
}

export function logoSvg({ name, bg, fg }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80" role="img" aria-label="${xml(name)} logo placeholder" ${PLACEHOLDER_SVG_MARKER}>
  <rect width="80" height="80" rx="16" fill="${bg}"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700" fill="${fg}">${xml(initials(name))}</text>
</svg>
`;
}

function sizeFor(refPath) {
  if (/logo/i.test(refPath)) return { width: 80, height: 80, logo: true };
  if (/\/og[.-]/i.test(refPath) || /\/og\./i.test(refPath)) return { width: 1200, height: 630 };
  if (/hero/i.test(refPath)) return { width: 1600, height: 900 };
  if (/^\/products\//i.test(refPath)) return { width: 800, height: 800 };
  if (/^\/projects\//i.test(refPath)) return { width: 1200, height: 900 };
  if (/^\/services\//i.test(refPath)) return { width: 1200, height: 800 };
  return { width: 1200, height: 800 };
}

export function isPlaceholderFile(file) {
  try {
    const buf = fs.readFileSync(file);
    if (file.toLowerCase().endsWith(".svg")) return buf.toString("utf8").includes(PLACEHOLDER_SVG_MARKER);
    if (file.toLowerCase().endsWith(".png")) return buf.includes(Buffer.from(PLACEHOLDER_PNG_MARKER, "latin1"));
    return false;
  } catch {
    return false;
  }
}

/**
 * Create placeholder files for every referenced image that does not exist yet.
 * Only .svg and .png can be generated; other formats need real photos and are reported as skipped.
 */
export function generatePlaceholders({ dir, config, content }) {
  const assets = path.join(dir, "assets");
  const primary = hexToRgb(config.brand.colors.primary) ?? [17, 24, 39];
  const tone = mix(primary, [255, 255, 255], 0.88);
  const created = [];
  const skipped = [];
  for (const ref of collectAssetRefs(config, content)) {
    const target = path.join(assets, ref.path);
    if (fs.existsSync(target)) continue;
    const ext = path.extname(ref.path).toLowerCase();
    const size = sizeFor(ref.path);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    if (ext === ".svg") {
      const svg = size.logo
        ? logoSvg({ name: config.business.name, bg: hex(primary), fg: "#ffffff" })
        : placeholderSvg({ ...size, label: ref.path, tone: hex(tone), ink: hex(primary) });
      fs.writeFileSync(target, svg);
      created.push(ref.path);
    } else if (ext === ".png") {
      fs.writeFileSync(target, makePng(size.width, size.height, tone));
      created.push(ref.path);
    } else {
      skipped.push(ref.path);
    }
  }
  return { created: [...new Set(created)], skipped: [...new Set(skipped)] };
}
