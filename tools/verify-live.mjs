// Usage: node tools/verify-live.mjs --client <slug> [--url https://project.pages.dev]
// Checks a deployed site: pages respond, images load, SEO tags present. Defaults to https://<domain>.
import { resolveTarget, loadClient, readTemplateMeta } from "../packages/build/load-client.mjs";
import { verifyLive } from "../packages/build/live-checks.mjs";
import { parseArgs } from "./args.mjs";

const args = parseArgs();
let target;
try {
  target = resolveTarget({ client: args.client, starter: args.starter });
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
const { config, content } = loadClient(target.dir);
const template = readTemplateMeta(config.template);
const url = args.url ?? `https://${config.seo.domain}`;

console.log(`Verifying ${url} against ${target.name}…`);
const { ok, results } = await verifyLive({ baseUrl: url, config, content, template });
for (const r of results) console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.detail ? ` — ${r.detail}` : ""}`);
console.log(ok ? "\nAll live checks passed." : "\nSome live checks failed.");
process.exit(ok ? 0 : 1);
