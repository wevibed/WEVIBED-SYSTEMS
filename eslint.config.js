import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["dist/**", "node_modules/**", "clients/*/assets/**"] },
  js.configs.recommended,
  {
    // Node-side code: tools, tests, build helpers, config package
    files: ["tools/**/*.mjs", "tests/**/*.mjs", "packages/build/**/*.mjs", "templates/*/vite.config.mjs"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.node } },
  },
  {
    // Pure logic shared by browser and Node
    files: ["packages/config/src/**/*.js", "packages/core/src/*.js", "packages/catalog/src/*.js"],
    languageOptions: { ecmaVersion: 2023, sourceType: "module", globals: { ...globals.browser, ...globals.node } },
  },
  {
    // React UI
    files: ["packages/**/*.jsx", "templates/*/src/**/*.{js,jsx}"],
    plugins: { react, "react-hooks": reactHooks },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: "module",
      globals: { ...globals.browser },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];
