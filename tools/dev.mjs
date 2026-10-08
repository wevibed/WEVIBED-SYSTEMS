// Usage: node tools/dev.mjs --client <slug> | --starter <template> [--port 5173]
// Live-reloading preview. Editing client.config.json or content/*.json reloads the page.
import { resolveTarget, loadClient } from "../packages/build/load-client.mjs";
import { createViteConfig } from "../packages/build/vite.base.mjs";
import { parseArgs } from "./args.mjs";

const args = parseArgs();
let target;
try {
  target = resolveTarget({ client: args.client, starter: args.starter });
} catch (e) {
  console.error(e.message);
  process.exit(2);
}
const { createServer } = await import("vite");
const { config } = loadClient(target.dir);
const base = createViteConfig({ templateName: config.template, clientDir: target.dir, outDir: "dist-dev" });
const server = await createServer({ ...base, server: { ...base.server, port: Number(args.port ?? 5173), open: false } });
await server.listen();
server.printUrls();
