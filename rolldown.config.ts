import { defineConfig } from "rolldown";

const prodBuild = true;

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
        dropConsole: prodBuild,
      },
    },
  },
  transform: {
    define: {
      __SOCKJS_VERSION__: JSON.stringify("1.6.1"),
      __DEBUG__: JSON.stringify(!prodBuild),
    },
  },
  resolve: {
    tsconfigFilename: "./tsconfig.json",
  },
});
