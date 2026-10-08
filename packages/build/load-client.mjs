// Reads a client (or template starter) folder from disk. Shared by the build plugin and all tools.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const TEMPLATES_DIR = path.join(ROOT, "templates");
export const CLIENTS_DIR = path.join(ROOT, "clients");

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function listTemplates() {
  if (!fs.existsSync(TEMPLATES_DIR)) return [];
  return fs
    .readdirSync(TEMPLATES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(TEMPLATES_DIR, d.name, "template.json")))
    .map((d) => d.name)
    .sort();
}

export function readTemplateMeta(templateName) {
  const file = path.join(TEMPLATES_DIR, templateName, "template.json");
  if (!fs.existsSync(file)) return null;
  return readJson(file);
}

/** Every buildable target: real clients first, then each template's starter. */
export function listTargets() {
  const targets = [];
  if (fs.existsSync(CLIENTS_DIR)) {
    for (const d of fs.readdirSync(CLIENTS_DIR, { withFileTypes: true })) {
      if (d.isDirectory() && fs.existsSync(path.join(CLIENTS_DIR, d.name, "client.config.json"))) {
        targets.push({ kind: "client", name: d.name, dir: path.join(CLIENTS_DIR, d.name) });
      }
    }
  }
  for (const t of listTemplates()) {
    const dir = path.join(TEMPLATES_DIR, t, "starter");
    if (fs.existsSync(path.join(dir, "client.config.json"))) {
      targets.push({ kind: "starter", name: `starter-${t}`, dir });
    }
  }
  return targets;
}

export function resolveTarget({ client, starter }) {
  if (client) {
    const dir = path.join(CLIENTS_DIR, client);
    if (!fs.existsSync(path.join(dir, "client.config.json"))) throw new Error(`No client "${client}" (looked in clients/${client}/client.config.json)`);
    return { kind: "client", name: client, dir };
  }
  if (starter) {
    const dir = path.join(TEMPLATES_DIR, starter, "starter");
    if (!fs.existsSync(path.join(dir, "client.config.json"))) throw new Error(`No starter for template "${starter}"`);
    return { kind: "starter", name: `starter-${starter}`, dir };
  }
  throw new Error("Specify --client <slug> or --starter <template>");
}

/**
 * Load config + content for a target. Never throws on bad content; parse errors are returned
 * so the checker can report them all at once.
 */
export function loadClient(dir) {
  const result = { dir, config: null, content: {}, errors: [] };
  const cfgFile = path.join(dir, "client.config.json");
  try {
    result.config = readJson(cfgFile);
  } catch (e) {
    result.errors.push({ file: "client.config.json", message: `cannot read/parse: ${e.message}` });
    return result;
  }
  const contentDir = path.join(dir, "content");
  if (fs.existsSync(contentDir)) {
    for (const f of fs.readdirSync(contentDir)) {
      if (!f.endsWith(".json")) continue;
      try {
        result.content[f.replace(/\.json$/, "")] = readJson(path.join(contentDir, f));
      } catch (e) {
        result.errors.push({ file: `content/${f}`, message: `cannot read/parse: ${e.message}` });
      }
    }
  }
  return result;
}

export function assetsDir(dir) {
  return path.join(dir, "assets");
}
