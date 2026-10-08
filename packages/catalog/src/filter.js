// Search and filter logic extracted from an existing catalogue site, made multi-word and pure.

export function tokenize(query) {
  return String(query ?? "").toLowerCase().split(/\s+/).filter(Boolean);
}

export function matchesQuery(product, tokens) {
  if (!tokens.length) return true;
  const hay = [product.name, product.category, product.keywords, product.description].filter(Boolean).join(" ").toLowerCase();
  return tokens.every((t) => hay.includes(t));
}

export function filterProducts(items, { query = "", category = "All", badge } = {}) {
  const tokens = tokenize(query);
  return items.filter(
    (p) =>
      (category === "All" || p.category === category) &&
      (!badge || (p.badges ?? []).includes(badge)) &&
      matchesQuery(p, tokens),
  );
}

/** Declared order first, then any categories only found on products. */
export function deriveCategories(items, declared = []) {
  const out = [...declared];
  for (const p of items) if (!out.includes(p.category)) out.push(p.category);
  return out;
}

export function isOrderable(product) {
  return product.availability !== "sold_out";
}
