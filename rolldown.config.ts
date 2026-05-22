import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/entry.ts",
  output: {
    file: "dist/sockjs.js",
    format: "esm",
    minify: {
      mangle: {
        toplevel: true,
      },
      compress: {
        dropConsole: true,
      },
    },
  },
  resolve: {
    tsconfigFilename: "./tsconfig.json",
  },
});
