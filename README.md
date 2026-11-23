# sockts

A modern, browser-only SockJS client — rewritten in pure TypeScript ESM.

This is a fork of [sockjs-client](https://github.com/sockjs/sockjs-client) stripped down to what matters in 2025: a clean ESM module with zero dependencies, no Node.js runtime support, no legacy browser workarounds, and no CommonJS artifacts.

## Why

The original `sockjs-client` was designed around 2011-era constraints: IE6/7/8 support, Node.js `http` fallback transports, CommonJS `require()`, and the `debug` npm package for logging. Over a decade later, every one of those concerns is obsolete for modern applications. This library removes them all and ships a small, type-safe ESM module instead.

### What changed

**Format & language**

- Pure TypeScript ESM — no `require()`, no `module.exports`, no CommonJS
- `export class` / `export function` / `export const` throughout (no default exports)
- Arrow functions instead of `const self = this` patterns
- Template literals instead of string concatenation
- `Date.now()` instead of `+new Date()`
- `"0".repeat(n)` instead of `new Array(n).join("0")`
- Rest parameters instead of `arguments` object
- `class extends` instead of the `inherits` npm package
- Native `URL` constructor instead of `url-parse` npm package
- Native `crypto.getRandomValues()` instead of Node.js `crypto.randomBytes()`
- Project's own `EventEmitter` instead of Node.js `events` module
- `console.log` with namespace prefixes instead of the `debug` npm package

**Node.js support removed**

- No `faye-websocket` — uses browser `WebSocket` directly
- No `eventsource` npm package — uses browser `EventSource` directly
- No Node.js `http`/`https`-based XHR driver
- No `shims.ts` (ES5 polyfills for old browsers)
- No Node.js `crypto` — uses Web Crypto API

**Legacy browser support removed**

- No `XDomainRequest` (IE8-9) — deleted `sender/xdr.ts`, `xdr-streaming.ts`, `xdr-polling.ts`
- No `ActiveXObject("htmlfile")` — deleted `receiver/htmlfile.ts`, `transport/htmlfile.ts`, `createHtmlfile()` from `utils/iframe.ts`
- No `ActiveXObject("Microsoft.XMLHTTP")` fallback in XHR
- No IE HTTP status code normalization (1223→204, 12005/12029→0)
- No `document.attachEvent` / `detachEvent` fallbacks — `addEventListener` only
- No IE JSONP `script.htmlFor` / `script.onclick` hack
- No IE `<iframe name="...">` createElement hack
- No `script.onreadystatechange` / `iframe.onreadystatechange` IE workarounds
- No Opera user-agent sniffing (`isOpera()`)
- No Konqueror user-agent sniffing (`isKonqueror()`)
- No Chrome packaged app detection (`chrome.app.runtime`)
- No `CollectGarbage()` IE COM hint
- No `doc.parentWindow` — IE-specific window reference
- No `!(this instanceof Constructor)` pattern (impossible with ES `class`)
- No `protocols_whitelist` deprecated option support

**Dependencies removed**

- `debug` — replaced with `console.log` namespaced calls
- `eventsource` — browser `EventSource` used directly
- `faye-websocket` — browser `WebSocket` used directly
- `inherits` — native `class extends`
- `url-parse` — native `URL` constructor

### Development

Requires Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` and npm 12.2.2. Vite+ is pinned to 1.7.0.

```bash
npm ci
npm run verify
```

Build, test, lint and formatting settings are in `vite.config.ts`. A global Vite+ installation is not required.

### Building

```bash
npm run build
```

Vite+ uses `tools/tsconfig.lib.json` to build `dist/sockjs.js` and the Oxc-generated declaration bundle `dist/entry.d.ts`.

### Testing

```bash
npm test
```

Vitest runs in Happy DOM to provide browser APIs for unit tests. Verify transport fallback separately in a real browser.

### Type checking

```bash
npm run typecheck
```

`npm run typecheck` uses native TypeScript 7 (`tsc -b`) through the root solution config, which only lists project references.
Shared options are in `tools/tsconfig.base.json`; the specialized configs are:

- `tools/tsconfig.test.json` — Vitest `*.test.ts` files.
- `tools/tsconfig.node.json` — root-level TypeScript configs and Node.js scripts in `tools/`.
- `tools/tsconfig.lib.json` — browser library sources and examples; also used by the bundler.

TypeScript build metadata is stored in `node_modules/.cache/`.

### Releases

Push the release notes on the default branch and run `npm run release` from a clean checkout.
It pushes the annotated `v<version>` tag, then updates the changelog and both npm manifests in a local `next version` patch commit. Push that commit separately.

Before the first tag, create the GitHub environment `npm` and allow only deployment tags matching `v*`. Restrict who can create or move release tags.
In [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers/), authorize `eliasku/sockjs-client`, workflow file `publish.yml`, environment `npm`, with direct `npm publish` allowed. No npm write token is needed.
The tag workflow type-checks, tests, and builds before publishing the packed artifact. If publishing fails due to configuration, fix it and rerun the tagged workflow rather than moving the tag.
