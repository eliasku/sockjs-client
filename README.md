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

Requires Node.js `^22.22.2 || ^24.15.0 || >=26.0.0` and npm 12.2.2. Vite+ is pinned to 1.5.0.

```bash
npm ci
npm run verify
```

Build, test, lint and formatting settings are in `vite.config.ts`. A global Vite+ installation is not required.

### Building

```bash
npm run build
```

Outputs the ESM bundle to `dist/sockjs.js` and bundled TypeScript declarations to `dist/entry.d.ts` through Vite+.

### Testing

```bash
npm test
```

Vitest runs in jsdom because the client uses browser event and transport APIs.

### Type checking

```bash
npm run typecheck
```

`npm run typecheck` runs `tsc -b` through the root solution config, which only lists project references.
Shared options are in `scripts/tsconfig.base.json`; the specialized configs are:

- `scripts/tsconfig.test.json` — Vitest `*.test.ts` files.
- `scripts/tsconfig.node.json` — root-level TypeScript configs and Node.js scripts in `scripts/`.
- `scripts/tsconfig.lib.json` — browser library sources and examples; also used by the bundler.

TypeScript build metadata is stored in `node_modules/.cache/`.
