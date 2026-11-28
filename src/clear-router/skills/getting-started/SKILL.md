---
name: getting-started
description: Set up and build with clear-react-router — provider-free routing for React SPAs with nested routes, loaders cached per pathname+search, URL search state, blocking, invalidation and prefetch. Route any AI task about this library here first.
metadata:
  type: framework
  library: 'clear-react-router'
  framework: react
sources:
  - https://github.com/AndrewBubnov/clear-react-router/blob/master/README.md
  - https://github.com/AndrewBubnov/clear-react-router/blob/master/src/playground/routes.tsx
  - https://github.com/AndrewBubnov/clear-react-router/blob/master/src/clear-router/types.ts
---

# clear-react-router

A provider-free routing library for client-side React SPAs: nested routes, loaders
with caching, actions, navigation blockers, prefetching, scroll restoration and
view transitions. There is no provider and no React context: all state lives in a
global store, components subscribe through hooks. One `<Router>` at the root,
hooks anywhere.

## Setup

Routes are plain objects created by `createRouter`:

```tsx
// routes.tsx
import { Router, createRouter, lazy } from 'clear-react-router';

const routes = createRouter([
	{
		path: '/users',
		element: lazy(() => import('./UsersPage')),
		loader: ({ params, searchParams, signal }) => fetchUsers(params, searchParams, signal),
		staleTime: 10_000, // cache entry lives this long
		loaderFallback: <PageSkeleton />, // rendered while status is 'pending'
		layout: UsersLayout, // receives the rendered section as `children`
		children: [{ path: '/:userId', element: <UserPage /> }], // child paths are relative
	},
	{ path: '*', element: <NotFound /> }, // catch-all, keep it last
]);

// App.tsx
createRoot(root).render(<Router routes={routes} />);
```

```tsx
// Any component — hooks read the global singleton, no prop drilling
import { useLoaderState, useNavigate, Link } from 'clear-react-router';

const { data, loaderError, beforeLoadError } = useLoaderState<User[]>();
const navigate = useNavigate();
navigate({ pathname: '/users', search: '?sort=asc' });
navigate({ path: '/users/:userId', params: { userId: '42' } }); // typed template
<Link to="/users" prefetch="hover">Users</Link>;
```

## Feature map

The whole surface, one line each — details live in the references (load by task
below):

- **Routing** — object routes with nested `children` (relative paths), `layout` /
  `layouts` nesting (outermost-first, inherited), lazy `element`s, catch-all `*`,
  typed path templates in `Link` (`path` + `params`) and `useNavigate`, active-link
  matching with `exact`, custom element rendering via `as`.
- **Loader caching** — per `pathname + search` keys; `staleTime` (route) /
  `defaultStaleTime`, `gcTime` + `maxCacheSize` (LRU eviction),
  `revalidateOnFocus` / `revalidateOnReconnect` background revalidation,
  `invalidate()` (current route, concrete paths, patterns, `withChildren`, `staleOnly`).
- **Retry** — `retry: { count, delay }` or a number, per route or `defaultRetry`;
  attempts get an `attempt` counter; aborted flights never commit.
- **Polling** — `pollingInterval` re-runs the loader while the route is active; stops
  on leave, restarts on return.
- **Background errors** — a failed background revalidation (invalidate, focus/reconnect, polling)
  keeps displayed data and reports instead of swapping the page: `loaderError` is set next to the
  data, `onBackgroundError(error, { path, route })` fires on `<Router>`, the cache entry is demoted
  to stale. The errorElement path is reserved for failures with nothing to display (initial load).
- **Loading UX** — `optimistic` (instant cache hit for revisited keys),
  `keepPreviousData` (previous data held during pending, same element),
  `loaderFallback` / `defaultLoaderFallback`, `minLoaderDuration` /
  `defaultMinLoaderDuration` (no skeleton flashing), `errorElement` /
  `defaultErrorElement`.
- **External data cache** — `externalCache` route flag (+ `defaultExternalCache`):
  hand freshness to TanStack Query or similar; the router stores values but never
  claims them fresh.
- **Search params** — `useSearchParams()`; every combination is a cached navigation
  (see the dedicated reference — the data-table pattern).
- **Guards & hooks** — `beforeLoad` (redirect, signal), `afterLoad`,
  `defaultBeforeLoad`, `defaultAfterLoad`, shared context via `useRouterContext`.
- **Blocking** — `useBlocker` for dirty forms: `unblocked` → `charged` → `blocked`,
  then `process()` / `reset()`.
- **Actions** — route-owned mutations via `actions` + `useSubmitAction` /
  `useAction`, with automatic invalidation of affected cache.
- **Prefetch** — `defaultPrefetch: 'hover' | 'viewport' | 'none'` (device-aware
  default), per-link `prefetch` override and `hoverPrefetchDelay`, concurrency 4/2,
  a prefetch never supersedes a running flight.
- **Scroll restoration** — `scrollRestoration` (window or named containers),
  `defaultScrollRestorationBehavior` (`'auto' | 'smooth'`), `useRestoreScroll`.
- **View transitions** — `isAnimated` / `animationDuration` wrap navigations in
  `startViewTransition`.
- **Cache observability** — `useCacheSnapshot()` + `enableCacheSnapshot` expose live
  cache entries (path, freshness, reason) for devtools UIs.

## Essential constraints

- **No context, no provider.** Hooks read a global singleton; render `<Router>` once.
- **The loader is the data owner.** `loader` receives
  `{ params, searchParams, urlSearchParams, context, setContext, location, signal, attempt }` and
  returns anything serializable. Its result is cached per **`pathname + search`** —
  a different query string is a different entry. `searchParams` is a plain object
  (repeated keys collapse to the last value); use `urlSearchParams.getAll('tag')` for
  multi-value keys.
- **`beforeLoad` is for guards, not data.** Redirect via `redirect()` in its args; a
  thrown/rejected error lands in `beforeLoadError` and renders `errorElement`.
- **Search params are navigations.** `setSearchParams` performs a full navigation: it
  pushes a history entry and re-runs the loader for the new `pathname + search`.
  Never bypass it by writing to the store or calling `history.*` directly.
- **Render during loading is a three-slot pipeline** (route-level opt-ins, see
  below): `optimistic` → `keepPreviousData` → `loaderFallback`. Errors always
  replace content with `errorElement`.
- **Routes without a `loader` never have loader data.** Such routes commit
  `status: 'active'` with `data === undefined`; an element there must not read `data`.
- **Aborts are automatic.** Each navigation has one signal, passed to the loader;
  superseding a navigation cancels the previous flight. Do not create your own
  `AbortController` for loaders.

## Scope boundaries

- Route URL state that must **survive a reload, be shareable by link, or drive the
  back button**. Everything else — open tabs, wizard steps, open accordions — is
  plain component state (`useState` + a tabs/stepper component). Do not route
  transient UI state.
- "Shareable" counts only when a link without the state **loses its meaning**
  (an onboarding step: yes; an open spoiler: no).
- Embedded panels that do need back or links (configurators, galleries) read and
  write their slice of the host page's search params — they never get a second router.
- One `<Router>` per page. This is a client-side SPA router by design; there is
  no SSR support.

## Load by task

- Route config, nesting, layouts, params, catch-all, lazy components →
  [routes and loaders](references/routes-and-loaders.md)
- Caching, `staleTime`/`gcTime`, loading UX (`optimistic`, `keepPreviousData`,
  `loaderFallback`, retry, polling, external cache) →
  [routes and loaders](references/routes-and-loaders.md)
- URL query state, filters/sort/pagination tables, multi-value params →
  [search params as state](references/search-params-state.md)
- Navigation, blockers, invalidation, prefetch, actions, scroll →
  [navigation and blocking](references/navigation-blocking-invalidation.md)

## API discovery

In an installed package, the public surface is
`node_modules/clear-react-router/dist/index.d.ts` — every exported symbol with its
signatures; consult `dist/index.js` only when runtime behavior is unclear.
In the repository, the entry point is `src/clear-router/index.ts` and
`src/clear-router/types.ts` holds `RouteItem` and hook signatures. The playground
(`src/playground/routes.tsx`) shows every feature wired end-to-end against a fake
in-browser server; the search page (`src/playground/SearchPage.tsx`) is the
reference for URL-owned query state with TanStack Table. Live demo:
https://clear-react-router.vercel.app/playground.
