// Cart logic extracted from an inline implementation on an existing client site. Pure and testable.
// The cart stores only ids and quantities; prices are looked up from the catalogue at render
// time, so changing products.json can never leave stale prices in a visitor's cart.

export function formatMoney(amount, symbol = "$") {
  return `${symbol}${Number(amount).toFixed(2).replace(/\.00$/, "")}`;
}

export function priceText(product, symbol = "$") {
  if (product.priceLabel) return product.priceLabel;
  if (product.price == null) return "Enquire for price";
  return `${formatMoney(product.price, symbol)}${product.unit ? ` ${product.unit}` : ""}`;
}

const lineKey = (id, size) => (size ? `${id}|${size}` : id);

export function cartReducer(state, action) {
  switch (action.type) {
    case "add": {
      const key = lineKey(action.id, action.size);
      const found = state.find((l) => l.key === key);
      if (found) return state.map((l) => (l.key === key ? { ...l, qty: l.qty + 1 } : l));
      return [...state, { key, id: action.id, size: action.size ?? null, qty: 1 }];
    }
    case "setQty":
      return action.qty <= 0 ? state.filter((l) => l.key !== action.key) : state.map((l) => (l.key === action.key ? { ...l, qty: Math.min(action.qty, 999) } : l));
    case "remove":
      return state.filter((l) => l.key !== action.key);
    case "clear":
      return [];
    default:
      return state;
  }
}

/** Defend against corrupted or tampered localStorage. */
export function sanitizeCart(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((l) => l && typeof l.id === "string" && typeof l.key === "string" && Number.isInteger(l.qty) && l.qty > 0 && l.qty < 1000)
    .map((l) => ({ key: l.key, id: l.id, size: typeof l.size === "string" ? l.size : null, qty: l.qty }));
}

/** Join cart lines with the catalogue; lines whose product no longer exists are dropped. */
export function cartLines(state, productsById) {
  const lines = [];
  for (const l of state) {
    const product = productsById[l.id];
    if (!product) continue;
    lines.push({ ...l, product, lineTotal: product.price == null ? null : product.price * l.qty });
  }
  return lines;
}

export function cartTotals(lines) {
  return {
    count: lines.reduce((n, l) => n + l.qty, 0),
    pricedTotal: lines.reduce((sum, l) => sum + (l.lineTotal ?? 0), 0),
    unpricedCount: lines.filter((l) => l.lineTotal == null).length,
  };
}

export function buildCartMessage({ businessName, lines, symbol = "$", note }) {
  const totals = cartTotals(lines);
  const body = lines.map((l, i) => {
    const size = l.size ? ` (size ${l.size})` : "";
    const price =
      l.product.price == null
        ? "price to confirm"
        : `${l.qty} × ${formatMoney(l.product.price, symbol)} = ${formatMoney(l.lineTotal, symbol)}`;
    return `${i + 1}. ${l.product.name}${size} — ${price}`;
  });
  const out = [`Hello ${businessName}, I would like to order / enquire about:`, "", ...body, ""];
  out.push(`Estimated total for priced items: ${formatMoney(totals.pricedTotal, symbol)}${totals.unpricedCount ? " (some items need a price confirmed)" : ""}`);
  if (note) out.push("", note);
  out.push("", "Please confirm availability and how to pay / collect.");
  return out.join("\n");
}
