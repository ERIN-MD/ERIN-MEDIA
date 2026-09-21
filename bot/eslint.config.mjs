// ESLint flat config — `npm run lint` had no config at all before, so it
// always failed. This is a deliberately pragmatic baseline for a large
// existing codebase: it catches real defects (undefined vars, unreachable
// code, duplicate keys/cases) without drowning the project in style noise.
import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**", "reports/**", "temp/**", "tmp/**", "downloads/**",
      "storage/**", "session/**", "database/**", "data/**", "assets/**",
      "plugins/main/_legacy/**",
    ],
  },
  js.configs.recommended,
  {
    // These files pass callbacks to Playwright's page.evaluate()/jsdom, which
    // execute in a BROWSER context. `document`/`location`/`window` there are
    // legitimate, so the no-undef reports on them were false positives.
    files: ["plugins/tools/ريد.js", "plugins/tools/فحص.js", "src/scraper/**/*.js"],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.node, ...globals.es2024 },
    },
    rules: {
      // style/quality signals in a large existing codebase — surfaced, not fatal
      "no-useless-assignment": "warn",
      "preserve-caught-error": "warn",
      "no-useless-catch": "warn",
      // real bugs — keep these as errors
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-self-compare": "error",
      "no-unsafe-negation": "error",
      "valid-typeof": "error",
      // noisy-but-not-broken in this codebase — surfaced, not fatal
      "no-unused-vars": ["warn", { args: "none", varsIgnorePattern: "^_" }],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-useless-escape": "warn",
      "no-control-regex": "off",
      "no-prototype-builtins": "warn",
    },
  },
];
