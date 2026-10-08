// WhatsApp link and message builders. Pure functions: one implementation for every site.

export function normalizeNumber(value) {
  return String(value ?? "").replace(/\D/g, "");
}

export function waLink(number, text) {
  const n = normalizeNumber(number);
  const base = `https://wa.me/${n}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Message sent when someone submits an enquiry form.
 * The business name always comes from the client config, never hard-coded.
 */
export function buildEnquiryMessage({ businessName, subject, fields, values }) {
  const lines = [`Hello ${businessName}${subject ? `, ${subject}` : ""}.`, ""];
  for (const f of fields) {
    const raw = values[f.name];
    const v = typeof raw === "string" ? raw.trim() : raw;
    if (v) lines.push(`${f.label}: ${v}`);
  }
  return lines.join("\n").trim();
}

export function productEnquiryText({ businessName, product, size, priceText }) {
  const parts = [`Hello ${businessName}, I'm interested in ${product.name}`];
  if (size) parts[0] += ` (size ${size})`;
  if (priceText) parts[0] += ` — ${priceText}`;
  parts[0] += ". Is it available?";
  return parts.join("");
}

export function generalEnquiryText(businessName) {
  return `Hello ${businessName}, I would like to make an enquiry.`;
}
