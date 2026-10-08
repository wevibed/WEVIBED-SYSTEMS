// Usage: node tools/check.mjs --all | --client <slug> | --starter <template> [--json]
import { listTargets, resolveTarget } from "../packages/build/load-client.mjs";
import { runChecks, checkSourceLeaks } from "../packages/build/checks.mjs";
import { parseArgs, selectTargets } from "./args.mjs";

const args = parseArgs();
let targets;
try {
  targets = selectTargets(args, listTargets, resolveTarget);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
if (!targets.length) {
  console.error("Nothing to check: no clients and no template starters found.");
  process.exit(2);
}

const report = [];
let failed = false;

if (args.all) {
  const sourceErrors = checkSourceLeaks();
  report.push({ name: "(shared source)", kind: "source", errors: sourceErrors, warnings: [] });
  if (sourceErrors.length) failed = true;
}

for (const t of targets) {
  const r = runChecks({ dir: t.dir, kind: t.kind, name: t.name });
  report.push({ name: t.name, kind: t.kind, ...r });
  if (r.errors.length) failed = true;
}

if (args.json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  for (const r of report) {
    const status = r.errors.length ? "FAIL" : r.warnings.length ? "ok (warnings)" : "ok";
    console.log(`\n${r.name} [${r.kind}] — ${status}`);
    for (const e of r.errors) console.log(`  ✗ ${e.message}  (${e.code})`);
    for (const w of r.warnings) console.log(`  ! ${w.message}  (${w.code})`);
  }
  const bad = report.filter((r) => r.errors.length).length;
  console.log(`\n${report.length} target(s) checked, ${bad} with errors.`);
}
process.exit(failed ? 1 : 0);
