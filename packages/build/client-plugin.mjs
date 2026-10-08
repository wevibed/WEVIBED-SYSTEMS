// Vite plugin that turns a client folder into:
//   - a virtual module `virtual:wevibed-client` ({ config, content, template }) for the React app
//   - static <head> tags (title, description, Open Graph, canonical, JSON-LD, theme variables, fonts)
//   - robots.txt, sitemap.xml and _headers in the build output
// It also fails the build with a readable message if the config or content are invalid.
import path from "node:path";
import { validateConfig, validateContent } from "../config/src/index.js";
import { loadClient, readTemplateMeta } from "./load-client.mjs";
import { buildHeadTags, buildSitemap, buildRobots, buildHeaders, listPaths } from "./head.mjs";

const VIRTUAL_ID = "virtual:wevibed-client";
const RESOLVED_ID = "\0" + VIRTUAL_ID;

export function clientPlugin({ clientDir, templateName }) {
  let data = null;

  const read = () => {
    const loaded = loadClient(clientDir);
    const template = readTemplateMeta(templateName);
    const problems = loaded.errors.map((e) => `${e.file}: ${e.message}`);
    if (!template) problems.push(`template "${templateName}" has no template.json`);
    if (loaded.config) {
      for (const i of validateConfig(loaded.config)) problems.push(`client.config.json ${i.path}: ${i.message}`);
      for (const [name, body] of Object.entries(loaded.content)) {
        for (const i of validateContent(name, body)) problems.push(`content/${name}.json ${i.path}: ${i.message}`);
      }
      if (template) {
        for (const req of template.content?.required ?? []) {
          if (!loaded.content[req]) problems.push(`content/${req}.json is required by template "${templateName}"`);
        }
      }
    }
    if (problems.length) {
      throw new Error(`Invalid client "${path.basename(clientDir)}":\n  - ${problems.join("\n  - ")}`);
    }
    return { config: loaded.config, content: loaded.content, template };
  };

  return {
    name: "wevibed-client",

    buildStart() {
      try {
        data = read();
      } catch (e) {
        this.error(e.message);
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },

    load(id) {
      if (id !== RESOLVED_ID) return null;
      if (!data) data = read();
      return `export default ${JSON.stringify(data)};`;
    },

    transformIndexHtml() {
      if (!data) data = read();
      return buildHeadTags(data.config);
    },

    generateBundle() {
      if (!data) data = read();
      const today = new Date().toISOString().slice(0, 10);
      this.emitFile({ type: "asset", fileName: "robots.txt", source: buildRobots(data.config) });
      this.emitFile({ type: "asset", fileName: "_headers", source: buildHeaders() });
      this.emitFile({
        type: "asset",
        fileName: "sitemap.xml",
        source: buildSitemap(data.config, listPaths(data.template, data.content), today),
      });
    },

    configureServer(server) {
      server.watcher.add(clientDir);
      server.watcher.on("change", (file) => {
        if (file.startsWith(clientDir) && file.endsWith(".json")) {
          data = null;
          const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
          if (mod) server.moduleGraph.invalidateModule(mod);
          server.ws.send({ type: "full-reload" });
        }
      });
    },
  };
}
