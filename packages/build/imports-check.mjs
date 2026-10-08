// Static import checker: catches the most common "it fails at build time" mistakes without needing
// node_modules: unresolved relative imports, names imported from a file that does not export them,
// packages missing from package.json, and JSX components used but never imported or defined.
import fs from "node:fs";
import path from "node:path";

const EXTS = [".js", ".jsx", ".mjs", ".json", ".css"];
const ALIASES = {
  "@wevibed/core": "packages/core/src/index.js",
  "@wevibed/catalog": "packages/catalog/src/index.js",
};
const VIRTUAL = new Set(["virtual:wevibed-client"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git", "assets", "starter"]);
const SOURCE_FILE = /\.(jsx?|mjs)$/;

const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[\s;{}])\/\/.*$/gm, "$1");

function resolveFile(from, spec, root) {
  const candidates = [];
  const base = ALIASES[spec] ? path.join(root, ALIASES[spec]) : path.resolve(path.dirname(from), spec);
  candidates.push(base, ...EXTS.map((e) => base + e), ...["index.js", "index.jsx"].map((i) => path.join(base, i)));
  return candidates.find((c) => fs.existsSync(c) && fs.statSync(c).isFile()) ?? null;
}

function parseClause(clause) {
  const out = { default: null, namespace: false, named: [] };
  let rest = clause.trim();
  const braces = rest.match(/\{([^}]*)\}/);
  if (braces) {
    out.named = braces[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim());
    rest = rest.replace(braces[0], "").replace(/,\s*$/, "").trim();
  }
  if (/^\*\s+as\s+/.test(rest)) out.namespace = true;
  else if (rest) out.default = rest.replace(/,$/, "").trim();
  return out;
}

const exportCache = new Map();

function exportsOf(file, root, stack = new Set()) {
  if (exportCache.has(file)) return exportCache.get(file);
  if (stack.has(file)) return new Set();
  stack.add(file);
  const names = new Set();
  const text = stripComments(fs.readFileSync(file, "utf8"));
  for (const m of text.matchAll(/export\s+(?:async\s+)?function\s*\*?\s*([\w$]+)/g)) names.add(m[1]);
  for (const m of text.matchAll(/export\s+(?:const|let|var|class)\s+([\w$]+)/g)) names.add(m[1]);
  if (/export\s+default\b/.test(text)) names.add("default");
  for (const m of text.matchAll(/export\s*\{([^}]*)\}\s*(?:from\s*["']([^"']+)["'])?/g)) {
    for (const part of m[1].split(",").map((s) => s.trim()).filter(Boolean)) {
      const segs = part.split(/\s+as\s+/);
      names.add((segs[1] ?? segs[0]).trim());
    }
  }
  for (const m of text.matchAll(/export\s*\*\s*(?:as\s+([\w$]+)\s*)?from\s*["']([^"']+)["']/g)) {
    if (m[1]) names.add(m[1]);
    else {
      const target = resolveFile(file, m[2], root);
      if (target && SOURCE_FILE.test(target)) for (const n of exportsOf(target, root, stack)) if (n !== "default") names.add(n);
    }
  }
  exportCache.set(file, names);
  return names;
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, files);
    } else if (SOURCE_FILE.test(entry.name)) files.push(full);
  }
  return files;
}

function jsxUndefined(text) {
  const used = new Set();
  for (const m of text.matchAll(/<\/?([A-Z][\w$]*)/g)) used.add(m[1]);
  const missing = [];
  for (const name of used) {
    const mentions = [...text.matchAll(new RegExp(`(?<![<\\w$/.])${name}(?![\\w$])`, "g"))].length;
    const asTag = [...text.matchAll(new RegExp(`</?${name}(?![\\w$])`, "g"))].length;
    if (mentions === 0 && asTag > 0) missing.push(name);
  }
  return missing;
}

/** @returns {{file: string, code: string, message: string}[]} */
export function checkImports({ root, dirs = ["packages", "templates", "tools"] }) {
  exportCache.clear();
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const known = new Set([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})]);
  const problems = [];
  const add = (file, code, message) => problems.push({ file: path.relative(root, file), code, message });

  for (const file of dirs.flatMap((d) => walk(path.join(root, d)))) {
    const raw = fs.readFileSync(file, "utf8");
    const text = stripComments(raw);

    const specs = [];
    for (const m of text.matchAll(/import\s+(?:type\s+)?([^'";]+?)\s+from\s*["']([^"']+)["']/g)) specs.push({ clause: parseClause(m[1]), spec: m[2] });
    for (const m of text.matchAll(/import\s*["']([^"']+)["']/g)) specs.push({ clause: null, spec: m[1] });
    for (const m of text.matchAll(/export\s+(?:\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s*from\s*["']([^"']+)["']/g)) specs.push({ clause: null, spec: m[1], reexport: m[0] });

    for (const { clause, spec, reexport } of specs) {
      if (spec.startsWith("node:") || VIRTUAL.has(spec) || spec.includes("${")) continue; // template-literal text, not an import
      const isLocal = spec.startsWith(".") || ALIASES[spec];
      if (!isLocal) {
        const pkgName = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        const builtin = ["fs", "path", "os", "url", "zlib", "child_process", "crypto", "assert"].includes(pkgName);
        if (!builtin && !known.has(pkgName)) add(file, "package-missing", `imports "${spec}" but "${pkgName}" is not in package.json`);
        continue;
      }
      const target = resolveFile(file, spec, root);
      if (!target) {
        add(file, "unresolved", `cannot resolve import "${spec}"`);
        continue;
      }
      if (!SOURCE_FILE.test(target)) continue;
      const available = exportsOf(target, root);
      if (clause) {
        if (clause.default && !available.has("default")) add(file, "no-default", `"${spec}" has no default export`);
        for (const n of clause.named) if (!available.has(n)) add(file, "missing-export", `"${n}" is not exported by "${spec}"`);
      }
      if (reexport) {
        const names = reexport.match(/\{([^}]*)\}/);
        if (names) {
          for (const part of names[1].split(",").map((s) => s.trim()).filter(Boolean)) {
            const original = part.split(/\s+as\s+/)[0].trim();
            if (!available.has(original)) add(file, "missing-export", `re-exports "${original}" from "${spec}", which does not export it`);
          }
        }
      }
    }

    if (file.endsWith(".jsx")) {
      for (const name of jsxUndefined(text)) add(file, "jsx-undefined", `<${name}> is used but never imported or defined`);
    }
  }
  return problems;
}
