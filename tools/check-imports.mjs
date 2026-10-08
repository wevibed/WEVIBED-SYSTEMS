// Usage: node tools/check-imports.mjs
import { ROOT } from "../packages/build/load-client.mjs";
import { checkImports } from "../packages/build/imports-check.mjs";

const problems = checkImports({ root: ROOT });
if (!problems.length) {
  console.log("Import check passed: all imports resolve and every JSX component is defined.");
  process.exit(0);
}
for (const p of problems) console.log(`✗ ${p.file}: ${p.message}  (${p.code})`);
console.log(`\n${problems.length} import problem(s).`);
process.exit(1);
