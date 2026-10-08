// Usage: node tools/build.mjs --all | --client <slug> | --starter <template>
// Runs the quality checks, builds with Vite, then verifies the build output.
import fs from "node:fs";
import path from "node:path";
import { listTargets, resolveTarget, loadClient, readTemplateMeta, ROOT } from "../packages/build/load-client.mjs";
import { runChecks, checkBuilt } from "../packages/build/checks.mjs";
import { createViteConfig } from "../packages/build/vite.base.mjs";
import { parseArgs, selectTargets } from "./args.mjs";

const args = parseArgs();
let vite;
try {
  vite = await import("vite");
} catch {
  console.error("Vite is not installed. Run `npm ci` (or `npm install`) first.");
  process.exit(2);
}

let targets;
try {
  targets = selectTargets(args, listTargets, resolveTarget);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}

const results = [];
for (const t of targets) {
  const started = Date.now();
  const row = { name: t.name, ok: false, seconds: 0, detail: "" };
  results.push(row);
  try {
    const pre = runChecks({ dir: t.dir, kind: t.kind, name: t.name });
    if (pre.errors.length) throw new Error(`checks failed:\n    ${pre.errors.map((e) => e.message).join("\n    ")}`);

    const { config, content } = loadClient(t.dir);
    const template = readTemplateMeta(config.template);
    const outDir = path.join(ROOT, "dist", t.name);
    await vite.build({ ...createViteConfig({ templateName: config.template, clientDir: t.dir, outDir }), logLevel: "warn" });

    const post = checkBuilt({ distDir: outDir, config, content, template });
    if (post.length) throw new Error(`build output problems:\n    ${post.map((e) => e.message).join("\n    ")}`);
    row.ok = true;
    row.detail = `${(fs.readdirSync(path.join(outDir, "assets")).length)} bundled files`;
  } catch (e) {
    row.detail = e.message;
  }
  row.seconds = Math.round((Date.now() - started) / 100) / 10;
}

console.log("");
for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name} (${r.seconds}s) ${r.ok ? r.detail : `\n    ${r.detail}`}`);
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} built successfully.`);
process.exit(failed ? 1 : 0);
