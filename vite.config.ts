import { defineConfig } from "vite-plus";

const define = {
  __SOCKJS_VERSION__: JSON.stringify("1.6.1"),
  __DEBUG__: "false",
};

export default defineConfig({
  define,
  tsconfig: "./scripts/tsconfig.lib.json",
  pack: [
    {
      entry: { sockjs: "src/entry.ts" },
      tsconfig: "./scripts/tsconfig.lib.json",
      dts: false,
      fixedExtension: false,
      target: "es2022",
      sourcemap: true,
      define,
      minify: {
        mangle: { toplevel: true },
        compress: { dropConsole: true },
      },
    },
    {
      entry: "src/entry.ts",
      tsconfig: "./scripts/tsconfig.lib.json",
      fixedExtension: false,
      dts: { emitDtsOnly: true },
    },
  ],
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "jsdom",
  },
  lint: {
    plugins: ["typescript", "unicorn", "oxc"],
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
    rules: {
      "no-console": "off",
      "no-underscore-dangle": "off",
      "no-shadow": "off",
      "unicorn/no-empty-file": "off",
      "oxc/erasing-op": "off",
      "typescript/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "typescript/consistent-type-imports": "error",
      "typescript/no-empty-object-type": "off",
      "eslint/no-useless-constructor": "off",
      "unicorn/prefer-add-event-listener": "off",
      "unicorn/require-post-message-target-origin": "off",
      "no-misleading-character-class": ["error", { allowEscape: true }],
      "no-control-regex": "off",
    },
    ignorePatterns: [
      "*.gen.ts",
      "*.js",
      "dist",
      "out",
      "node_modules",
      "playwright-report",
      "test-results",
      ".opencode",
      ".github",
      ".vscode",
    ],
  },
  fmt: {
    printWidth: 120,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    bracketSpacing: true,
    arrowParens: "avoid",
    endOfLine: "lf",
    sortPackageJson: false,
    ignorePatterns: ["*.js", "*.gen.ts", "dist", "out", "node_modules", "playwright-report", "package-lock.json"],
  },
});
