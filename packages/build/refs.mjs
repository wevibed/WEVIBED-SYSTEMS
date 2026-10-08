// Finds every image path and every text string in a client's config and content.

const IMAGE_PATH = /^\/[^\s]*\.(png|jpe?g|webp|avif|svg|gif|ico)$/i;

/** Returns [{ path: "/products/a.jpg", where: "content.products.items[0].image" }]. */
export function collectAssetRefs(config, content) {
  const refs = [];
  const walk = (value, where) => {
    if (typeof value === "string") {
      if (IMAGE_PATH.test(value)) refs.push({ path: value, where });
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => walk(v, `${where}[${i}]`));
    } else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) walk(v, where ? `${where}.${k}` : k);
    }
  };
  walk(config, "config");
  for (const [name, body] of Object.entries(content ?? {})) walk(body, `content.${name}`);
  return refs;
}

/** Returns [{ text, where }] for every string value. */
export function collectStrings(config, content) {
  const out = [];
  const walk = (value, where) => {
    if (typeof value === "string") out.push({ text: value, where });
    else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${where}[${i}]`));
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) walk(v, where ? `${where}.${k}` : k);
  };
  walk(config, "config");
  for (const [name, body] of Object.entries(content ?? {})) walk(body, `content.${name}`);
  return out;
}

/** Count of content items flagged `placeholder: true`. */
export function countPlaceholderItems(content) {
  let n = 0;
  const walk = (value) => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value && typeof value === "object") {
      if (value.placeholder === true) n += 1;
      Object.values(value).forEach(walk);
    }
  };
  walk(content);
  return n;
}
