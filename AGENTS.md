# AGENTS.md — guide for AI coding agents working in this repo

`clear-react-router`: a lightweight, provider-free routing library for React SPAs
(nested routes, loaders with caching, actions, blockers, prefetch, scroll restoration).
Single maintainer project — keep changes small, consistent and verified.

## Layout

- `src/clear-router/` — the library itself:
  - `create.ts` — tiny pub/sub store (`create`, `useGlobalState`); framework-free.
  - `runtime/` — navigation, cache revalidation, invalidate, prefetch (no React).
  - `creators/` — `createRouter()` (route normalization) and `createRouterInstance()`.
  - `hooks/` — public React hooks (thin wrappers over `router.hooks`).
  - `components/` — `Router`, `Link` (+ `ElementProps` lives in `Link.tsx`).
  - `utils/` — `lazy`/`createLazyComponent`/`renderElement` are React-side; the rest is core.
  - `config/routerConfig.ts`, `constants.ts`, `types.ts`, `instance.ts` (singleton wiring).
  - `index.ts` — the ONLY public entry point. Never import internals from outside the package.
- `src/playground/` — public demo app (fake in-browser server in `api.ts`), deployed to Vercel.
- `src/e2e-demo.tsx` — minimal app for Playwright, rendered only with `VITE_E2E=1`.
- Tests live next to sources: `src/clear-router/__tests__/integration/*.test.*` (vitest),
  `src/clear-router/__tests__/e2e/*.spec.ts` (Playwright).

## Commands (run from repo root, PowerShell 5.1 — no `&&`, `tail`, `grep`, `head`)

- `npm run dev` — demo on :5173. `npm run build` — `tsc -b && vite build`.
- `npx vitest run` — unit/integration suite. `npx tsc -b` (add `--force` after moving files — stale `.tsbuildinfo` lies).
- `npm run test:e2e` — Playwright, Chromium only, own dev server on **:5174**.
- `npx eslint .` / `npx eslint <paths>` — must be clean.
- Library dist build: `npm run build` inside `src/clear-router` (own package.json).

## Architecture rules (do not break)

- **Singleton router.** One global instance (`instance.ts`); `RouterType.runtime` = { navigate, invalidate, prefetch }.
- **Stores, not context.** All state lives in `create()` stores; components subscribe via `Synchronizer`
  (`useSyncExternalStore` for React). New subscriptions: prefer narrow selectors returning
  primitives — never subscribe to whole state when a slice suffices.
- **Framework-free core is machine-enforced.** `src/clear-router/{create,types,constants}.ts`,
  `runtime/**`, `config/**`, `creators/**` and listed `utils/*` must never import `react`
  (`no-restricted-imports`, fail-closed: ban is package-wide, React side is explicitly allow-listed).
  React code belongs in `components/`, `hooks/`, `instance.ts`, `index.ts`, `lazy`/`createLazyComponent`/`renderElement`.
- **Type-only cross-imports**: `import type` between `create.ts` ↔ `types.ts` (they reference each other).
- **History writes go through the store.** `commitState` (push) and `setSearchParams`-style flows must update
  `routeItemDataState` next to `pushState`/`replaceState`. Never add a second source of truth for the URL.
- **Status semantics**: `routeItemData.status` ∈ idle|pending|active|optimistic|error. Element renders only
  with matching `loaderState` — see `prepareNavigation` branches; keep them paired in the same commit.

## Code style

- Prettier: tabs, single quotes, semicolons, printWidth 120, `arrowParens: avoid`. Match surrounding code.
- `import type { ... }` for type-only imports. No new dependencies without asking.
- Prefer editing existing files over creating new ones. No proactively created docs besides this file.

## Testing conventions

- Integration tests: real timers by default; `window.history.pushState({}, '', '/')` in `beforeEach`;
  fresh `createRouter()` routes per test (the router singleton and `routerConfig` persist across tests in a file).
- Async loaders in tests: deferred promises (`let resolveLoader!`), never fixed sleeps for control flow.
- Deterministic UI tests over store snapshots for user-visible behavior; store-level tests for runtime logic.
- **Red-phase discipline**: every new regression test must be proven to fail without the fix (temporary revert),
  then restored. A test that never failed proves nothing.
- E2E: deterministic locators (`data-testid`), `expect.poll` instead of `waitForTimeout`, one behavior per spec.
  If the whole e2e suite fails on the first line with empty DOM, check for a zombie `vite` on :5174 first —
  `reuseExistingServer` silently reuses foreign servers.
- jsdom gaps (mocked in `src/test/setup.ts`): `matchMedia`, `scrollTo`, `requestAnimationFrame`,
  `Element.scrollTo` (does NOT exist — mock per element or on prototype), `IntersectionObserver` (absent).

## Gotchas & hard rules

- **NEVER inspect, pop, drop or clear `git stash`** — it holds the maintainer's private WIP. Use `git diff`/`git status` only.
- **Do not commit, push, amend or open PRs** unless explicitly asked. Leave the tree ready, report the diff.
- The IDE language server frequently serves stale cross-branch diagnostics — trust `tsc`/`vitest`, not squiggles.
  Restart the TS server if errors contradict a green `tsc -b --force`.
- `plan` mode (if active in your harness): read, search, delegate and plan only — no edits, no installs,
  no shell writes. Wait for explicit mode exit.
- Public API changes (anything exported from `index.ts`, prop/hook signatures, type widening) are breaking
  decisions — propose, don't implement unasked. Internal refactoring needs no permission but must keep the suite green.
