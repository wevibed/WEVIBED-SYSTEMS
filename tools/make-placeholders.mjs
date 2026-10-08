// Usage: node tools/make-placeholders.mjs --client <slug> | --starter <template>
// Creates labelled placeholder images for any image referenced in the config/content but missing from assets/.
import { resolveTarget, loadClient } from "../packages/build/load-client.mjs";
import { generatePlaceholders } from "../packages/build/placeholders.mjs";
import { parseArgs } from "./args.mjs";

const args = parseArgs();
let target;
try {
  target = resolveTarget({ client: args.client, starter: args.starter });
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
const { config, content, errors } = loadClient(target.dir);
if (!config) {
  console.error(errors.map((e) => `${e.file}: ${e.message}`).join("\n"));
  process.exit(1);
}
const { created, skipped } = generatePlaceholders({ dir: target.dir, config, content });
console.log(`${target.name}: created ${created.length} placeholder image(s).`);
for (const p of created) console.log(`  + ${p}`);
if (skipped.length) {
  console.log(`\nCannot generate these formats; supply real photos:`);
  for (const p of skipped) console.log(`  - ${p}`);
}
console.log("\nPlaceholders are marked, and `npm run check` blocks status \"live\" while any remain.");
