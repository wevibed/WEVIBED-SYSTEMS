import { CONFIG_SCHEMA, CONTENT_SCHEMAS } from "./schema.js";
import { validate } from "./validate.js";

export { CONFIG_SCHEMA, CONTENT_SCHEMAS } from "./schema.js";
export { validate } from "./validate.js";
export * from "./color.js";
export * from "./meta.js";

/** Validate a parsed client.config.json. Returns [{path, message}]. */
export function validateConfig(config) {
  const issues = validate(config, CONFIG_SCHEMA);
  if (issues.length) return issues; // cross-field rules assume a structurally valid config

  const forms = config.forms ?? {};
  if (forms.mode === "endpoint" && !forms.endpoint) {
    issues.push({ path: "forms.endpoint", message: 'is required when forms.mode is "endpoint"' });
  }
  return issues;
}

/** Validate a parsed content file (name is the file name without .json). */
export function validateContent(name, data) {
  const schema = CONTENT_SCHEMAS[name];
  if (!schema) return [{ path: name, message: `no schema registered for content file "${name}"` }];
  const issues = validate(data, schema, "");
  // duplicate ids make links and carts ambiguous
  if (!issues.length && Array.isArray(data.items)) {
    const seen = new Set();
    for (const item of data.items) {
      if (item.id === undefined) continue;
      if (seen.has(item.id)) issues.push({ path: `items[id=${item.id}]`, message: "duplicate id" });
      seen.add(item.id);
    }
  }
  return issues;
}
