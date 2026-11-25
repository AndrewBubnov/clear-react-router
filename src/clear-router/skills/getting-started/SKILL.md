---
name: getting-started
description: Set up and build with clear-react-router — provider-free routing for React SPAs: nested routes, loaders with per-path+search caching, URL search state, blocking, invalidation and prefetch. Route any AI task about this library here first.
metadata:
  type: framework
  library: 'clear-react-router'
  framework: react
sources:
  - https://github.com/AndrewBubnov/clear-react-router/blob/master/README.md
  - https://github.com/AndrewBubnov/clear-react-router/blob/master/src/playground/routes.tsx
  - https://github.com/AndrewBubnov/clear-react-router/blob/master/src/e2e-demo.tsx
---

# clear-react-router

A lightweight, provider-free routing library for client-side React SPAs. There is no
provider and no React context: all state lives in a global store, components subscribe
through hooks. One `<Router>` at the root, hooks anywhere.

## Setup

```tsx
import { Router, createRouter, lazy, useLoaderState, Link } from 'clear-react-router';

const routes = createRouter([
	{
		path: '/users',
		element: lazy(() => import('./UsersPage')),
		loader: ({ params, searchParams, signal }) => fetchUsers(params, searchParams, signal),
		staleTime: 10_000, // cache entry lives this long
		loaderFallback: <PageSkeleton />, // rendered while status is 'pending'
		children: [{ path: '/:userId', element: <UserPage /> }], // paths are relative
	},
	{ path: '*', element: <NotFound /> }, // catch-all, keep it last
]);

createRoot(root).render(<Router routes={routes} />);
```

```tsx
// Any component
const { data, loaderError, beforeLoadError } = useLoaderState<User[]>();
const navigate = useNavigate();
navigate({ pathname: '/users', search: '?sort=asc' });
```

## Essential constraints

- **No context, no provider.** Hooks read a global singleton; render `<Router>` once.
- **The loader is the data owner.** `loader` receives `{ params, searchParams, context,
  setContext, location, signal, attempt }` and returns anything serializable. Its result
  is cached per **`pathname + search`** — a different query string is a different entry.
- **`beforeLoad` is for guards, not data.** Redirect via `redirect(location)` in its args;
  a thrown/rejected error lands in `beforeLoadError` and renders `errorElement`.
- **Search params are navigations.** `setSearchParams` performs a full navigation: it
  pushes a history entry and re-runs the loader for the new `pathname + search`. Never
  bypass it by writing to the store or calling `history.*` directly.
- **Render during loading is a three-slot pipeline** (route-level opt-ins, see below):
  `optimistic` → `keepPreviousData` → `loaderFallback`. Errors always replace content
  with `errorElement`.
- **Routes without a `loader` never have loader data.** Such routes commit
  `status: 'active'` with `data === undefined`; an element there must not read `data`.
- **Aborts are automatic.** Each navigation has one signal, passed to the loader;
  superseding a navigation cancels the previous flight. Do not create your own
  `AbortController` for loaders.

## Load by task

- Route config, nested routes, layouts, params, catch-all, lazy elements →
  [routes and loaders](references/routes-and-loaders.md)
- Caching, `staleTime`/`gcTime`, loading UX (`optimistic`, `keepPreviousData`,
  `loaderFallback`, retry, polling) → [loaders and caching](references/routes-and-loaders.md)
- URL query state, filters/sort/pagination tables, multi-value params →
  [search params as state](references/search-params-state.md)
- Navigation, blockers, invalidation, prefetch, actions →
  [navigation and blocking](references/navigation-blocking-invalidation.md)

## API discovery

Inspect `src/clear-router/index.ts` (the only public entry point), then `src/clear-router/types.ts`
for `RouteItem` and hook signatures. The playground (`src/playground/routes.tsx`) shows every
feature wired end-to-end against a fake in-browser server.
