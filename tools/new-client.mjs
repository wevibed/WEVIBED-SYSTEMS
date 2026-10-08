// Usage:
//   node tools/new-client.mjs --template retail --slug acme-shoes --name "Acme Shoes" \
//        --whatsapp 263771234567 --domain acmeshoes.co.zw [--city Harare] [--intake intake.json]
// Copies the template's starter into clients/<slug>, fills in the basics, creates placeholder images,
// starts the delivery timer and prints the remaining checklist.
import fs from "node:fs";
import path from "node:path";
import { CLIENTS_DIR, TEMPLATES_DIR, listTemplates, loadClient } from "../packages/build/load-client.mjs";
import { generatePlaceholders, isPlaceholderFile } from "../packages/build/placeholders.mjs";
import { runChecks } from "../packages/build/checks.mjs";
import { parseArgs } from "./args.mjs";

const args = parseArgs();
const fail = (msg) => {
  console.error(`✗ ${msg}`);
  process.exit(2);
};

const templates = listTemplates();
if (!args.template || !templates.includes(args.template)) fail(`--template must be one of: ${templates.join(", ")}`);
if (!args.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(args.slug)) fail("--slug is required (lowercase letters, numbers, hyphens)");
if (!args.name || args.name === true) fail('--name "Business Name" is required');
const dest = path.join(CLIENTS_DIR, args.slug);
if (fs.existsSync(dest)) fail(`clients/${args.slug} already exists; nothing was changed`);

const deepMerge = (a, b) => {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v) && a[k] && typeof a[k] === "object" && !Array.isArray(a[k])) deepMerge(a[k], v);
    else a[k] = v;
  }
  return a;
};

const starter = path.join(TEMPLATES_DIR, args.template, "starter");
fs.cpSync(starter, dest, { recursive: true });

const cfgFile = path.join(dest, "client.config.json");
const config = JSON.parse(fs.readFileSync(cfgFile, "utf8"));
config.status = "draft";
config.business.name = args.name;
delete config.business.shortName;
config.deploy.cloudflareProject = args.slug;
if (args.whatsapp) {
  const n = String(args.whatsapp).replace(/\D/g, "");
  config.contact.whatsapp = n;
  config.contact.phoneDisplay = n.startsWith("263") ? `0${n.slice(3, 5)} ${n.slice(5, 8)} ${n.slice(8)}` : `+${n}`;
}
if (args.domain) config.seo.domain = String(args.domain).toLowerCase();
else config.seo.domain = `${args.slug}.pages.dev`;
if (args.city) config.contact.address.city = args.city;
if (args.intake) {
  const intake = JSON.parse(fs.readFileSync(args.intake, "utf8"));
  deepMerge(config, intake);
}
fs.writeFileSync(cfgFile, `${JSON.stringify(config, null, 2)}\n`);

// Remove placeholder images copied from the starter so fresh ones carry the new client's colours and initials.
const assetsDir = path.join(dest, "assets");
const dropPlaceholders = (dir) => {
  for (const entry of fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }) : []) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) dropPlaceholders(full);
    else if (isPlaceholderFile(full)) fs.rmSync(full);
  }
};
dropPlaceholders(assetsDir);
const { content } = loadClient(dest);
const fresh = generatePlaceholders({ dir: dest, config, content });
const now = new Date().toISOString();
fs.writeFileSync(path.join(dest, ".timing.json"), `${JSON.stringify({ template: args.template, milestones: { created: now } }, null, 2)}\n`);

const result = runChecks({ dir: dest, kind: "client", name: args.slug });
console.log(`✓ Created clients/${args.slug} from template "${args.template}" (${fresh.created.length} new placeholder image(s), assets in ${path.relative(process.cwd(), assetsDir)})`);
console.log(`  checks: ${result.errors.length} error(s), ${result.warnings.length} warning(s)`);
console.log(`
Next steps (see docs/WORKFLOW.md):
  1. Fill in clients/${args.slug}/client.config.json (contact, address, brand colours, hero text)
  2. Replace content/*.json with the client's real products/projects/services
  3. Drop real photos into clients/${args.slug}/assets/ and point the JSON at them
  4. npm run dev -- --client ${args.slug}      (live preview)
  5. npm run check                               (must be clean before "live")
  6. npm run timing -- mark ${args.slug} first-green-build   (after CI is green)
  7. Deploy: GitHub → Actions → "Deploy client" → ${args.slug}
`);
