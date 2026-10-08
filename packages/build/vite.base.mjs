// One Vite configuration for every template. A build is always (template, client folder).
import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import { clientPlugin } from "./client-plugin.mjs";
import preset from "./tailwind.preset.mjs";
import { ROOT, TEMPLATES_DIR } from "./load-client.mjs";

export function createViteConfig({ templateName, clientDir, outDir }) {
  const templateDir = path.join(TEMPLATES_DIR, templateName);
  return {
    configFile: false,
    root: templateDir,
    base: "/",
    // The client's assets folder is served/copied at the site root: /logo.svg, /products/x.jpg ...
    publicDir: path.join(clientDir, "assets"),
    plugins: [react(), clientPlugin({ clientDir, templateName })],
    resolve: {
      alias: {
        "@wevibed/core": path.join(ROOT, "packages/core/src/index.js"),
        "@wevibed/catalog": path.join(ROOT, "packages/catalog/src/index.js"),
      },
    },
    css: {
      postcss: {
        plugins: [
          tailwindcss({
            presets: [preset],
            content: [
              path.join(templateDir, "index.html"),
              path.join(templateDir, "src/**/*.{js,jsx}"),
              path.join(ROOT, "packages/core/src/**/*.{js,jsx}"),
              path.join(ROOT, "packages/catalog/src/**/*.{js,jsx}"),
            ],
          }),
          autoprefixer(),
        ],
      },
    },
    build: { outDir, emptyOutDir: true, sourcemap: false, chunkSizeWarningLimit: 600 },
    server: { fs: { allow: [ROOT] } },
  };
}
