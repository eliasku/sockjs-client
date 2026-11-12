# Changelog

## 0.0.8 (unreleased)

-

## 0.0.7

- Split TypeScript configuration into shared, Vitest, Node.js and browser projects under `scripts/`.
- Use `tsc -b` for type checking, cache build metadata in `node_modules/.cache/` and select the browser config for bundling.
- Enable standard ECMAScript class-field semantics in the TypeScript configuration.
- Add regressions for inherited event metadata, isolated listeners and SockJS close callbacks.

- Migrate build, tests, lint and formatting to Vite+ 1.5.0 and npm 12.2.2.
- Run Vitest in jsdom and preserve the published ESM and declaration entry paths.

## 0.0.5

- remove `toSorted` usage

## 0.0.4

- fix compat with `IStompSocket`

## 0.0.3

- fix missing `onopen`

## 0.0.2

- fix `main.d.ts` export

## 0.0.1

- initial port to typescript, esnext, modern browsers
