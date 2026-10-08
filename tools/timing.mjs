// Delivery timing, so improvement is measured, not guessed.
//   node tools/timing.mjs mark <slug> <milestone>   record a milestone now
//   node tools/timing.mjs report                    durations for every client
// Milestones used by the workflow: agreed, content-received, first-green-build, client-approved, deployed, dns-live.
// "created" is written automatically by `npm run new-client`.
import fs from "node:fs";
import path from "node:path";
import { CLIENTS_DIR } from "../packages/build/load-client.mjs";
import { parseArgs } from "./args.mjs";

const file = (slug) => path.join(CLIENTS_DIR, slug, ".timing.json");
const read = (slug) => (fs.existsSync(file(slug)) ? JSON.parse(fs.readFileSync(file(slug), "utf8")) : null);

function formatDuration(ms) {
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 48) return `${h} h ${mins % 60} min`;
  return `${(h / 24).toFixed(1)} days`;
}

const [command, slug, milestone] = parseArgs()._;

if (command === "mark") {
  if (!slug || !milestone) {
    console.error("Usage: node tools/timing.mjs mark <slug> <milestone>");
    process.exit(2);
  }
  const data = read(slug);
  if (!data) {
    console.error(`No timing file for "${slug}". Was the client created with npm run new-client?`);
    process.exit(1);
  }
  data.milestones[milestone] = new Date().toISOString();
  fs.writeFileSync(file(slug), `${JSON.stringify(data, null, 2)}\n`);
  console.log(`${slug}: ${milestone} recorded at ${data.milestones[milestone]}`);
} else if (command === "report") {
  const slugs = fs.existsSync(CLIENTS_DIR) ? fs.readdirSync(CLIENTS_DIR).filter((s) => read(s)) : [];
  if (!slugs.length) console.log("No timed clients yet. Create one with npm run new-client.");
  for (const s of slugs) {
    const d = read(s);
    const start = new Date(d.milestones.agreed ?? d.milestones.created).getTime();
    console.log(`\n${s} (template: ${d.template}) — clock starts at ${d.milestones.agreed ? "agreed" : "created"}`);
    for (const [name, at] of Object.entries(d.milestones)) {
      console.log(`  ${name.padEnd(20)} +${formatDuration(new Date(at).getTime() - start)}`);
    }
  }
} else {
  console.error("Usage: node tools/timing.mjs mark <slug> <milestone> | report");
  process.exit(2);
}
