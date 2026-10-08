// Minimal declarative validator. No dependencies so it runs before `npm install`
// and in any environment. Unknown keys are errors (catches typos in client files).
import { isHexColor } from "./color.js";

const FORMATS = {
  hex: (v) => isHexColor(v),
  url: (v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" || u.protocol === "http:";
    } catch {
      return false;
    }
  },
  whatsapp: (v) => /^[1-9]\d{7,14}$/.test(v),
  domain: (v) => /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(v) && !/^https?:/i.test(v),
  slug: (v) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v),
  assetPath: (v) => /^\/[^\s]+$/.test(v) && !v.includes(".."),
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  route: (v) => /^(\/|#|https?:\/\/|tel:|mailto:)/.test(v),
};

const FORMAT_HINT = {
  hex: "a hex colour like #1a2b3c",
  url: "a full http(s) URL",
  whatsapp: "digits only with country code, no + or spaces (e.g. 263771234567)",
  domain: "a bare domain like example.co.zw (no https://)",
  slug: "lowercase letters, numbers and single hyphens",
  assetPath: "a path starting with / that points into the client's assets folder",
  email: "an email address",
  route: "a path starting with /, an #anchor, or an http(s)/tel/mailto link",
};

const typeOf = (v) => (Array.isArray(v) ? "array" : v === null ? "null" : typeof v);

export function validate(value, schema, path = "") {
  const issues = [];
  const at = path || "(root)";
  const t = typeOf(value);

  if (value === null && schema.nullable) return issues;
  if (t !== schema.type) {
    issues.push({ path: at, message: `expected ${schema.type}, got ${t}` });
    return issues;
  }

  if (schema.type === "string") {
    if (schema.min != null && value.trim().length < schema.min) issues.push({ path: at, message: `must have at least ${schema.min} character(s)` });
    if (schema.max != null && value.length > schema.max) issues.push({ path: at, message: `must have at most ${schema.max} characters (has ${value.length})` });
    if (schema.values && !schema.values.includes(value)) issues.push({ path: at, message: `must be one of: ${schema.values.join(", ")}` });
    if (schema.format && !FORMATS[schema.format](value)) issues.push({ path: at, message: `must be ${FORMAT_HINT[schema.format]}` });
  }

  if (schema.type === "number") {
    if (!Number.isFinite(value)) issues.push({ path: at, message: "must be a finite number" });
    if (schema.min != null && value < schema.min) issues.push({ path: at, message: `must be >= ${schema.min}` });
    if (schema.values && !schema.values.includes(value)) issues.push({ path: at, message: `must be one of: ${schema.values.join(", ")}` });
  }

  if (schema.type === "array") {
    if (schema.min != null && value.length < schema.min) issues.push({ path: at, message: `needs at least ${schema.min} item(s)` });
    if (schema.items) value.forEach((item, i) => issues.push(...validate(item, schema.items, `${path}[${i}]`)));
  }

  if (schema.type === "object") {
    const props = schema.props ?? {};
    for (const [key, sub] of Object.entries(props)) {
      const childPath = path ? `${path}.${key}` : key;
      if (!(key in value) || value[key] === undefined) {
        if (sub.required) issues.push({ path: childPath, message: "is required" });
        continue;
      }
      issues.push(...validate(value[key], sub, childPath));
    }
    if (!schema.open) {
      for (const key of Object.keys(value)) {
        if (!(key in props)) issues.push({ path: path ? `${path}.${key}` : key, message: "unknown field (typo?)" });
      }
    }
  }

  return issues;
}
