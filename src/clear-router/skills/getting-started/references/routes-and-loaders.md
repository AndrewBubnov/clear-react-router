# Routes and loaders

## Route shape

```tsx
{
	path: '/users',                 // children are appended: '/users/:userId'
	element: <UsersPage />,         // or lazy(() => import('./UsersPage'))
	loader: fetchUsers,             // optional; data cached per pathname + search
	beforeLoad: async ({ redirect, signal }) => { ... },   // guards, redirects
	afterLoad: async ({ params, context }) => { ... },     // runs after every successful navigation
	retry: { count: 3, delay: 400 },// retry failed loader attempts (or a number = count)
	staleTime: 10_000,              // ms before the cache entry goes stale
	gcTime: 30_000,                 // idle entry is evicted after this
	optimistic: true,               // instant cache hit for revisited keys
	keepPreviousData: true,         // keep previous data on screen during pending
	loaderFallback: <Skeleton />,   // rendered while pending (no keepPreviousData)
	errorElement: lazy(() => import('./ErrorView')), // on beforeLoad or loader failure
	pollingInterval: 3000,          // re-run the loader while the route is active
	externalCache: false,           // opt out of router cache freshness for this route
	scrollRestoration: 'feed',      // restore window or named container scroll
	children: [ ... ],              // nested routes; child paths are relative
}
```

Layouts: `layout: Component` (or `layouts: [Outer, Inner]` on a parent route) wraps the
section and receives the rendered children as `children` — no Outlet component; layouts
stack outermost-first and are inherited by descendants. The catch-all
`{ path: '*', element: <NotFound /> }` matches any depth; keep it last.

## Loader args

```ts
loader: ({ params, searchParams, context, setContext, location, signal, attempt }) => Promise<unknown>
```

- `params` — path params (`/users/:userId` → `{ userId }`).
- `searchParams` — plain object built from the URL query (multi-value keys collapse to
  the last value; for multi-value reads use `location.search` directly).
- `signal` — abort signal of the owning navigation; pass it to `fetch`.
- `attempt` — 1-based retry attempt number.
- `setContext` — write shared context during load (React-friendly: batched updates).

## Caching

- Key: `pathname + search`. Same path with a different query = a different entry.
- Fresh within `staleTime` (route-level) or `defaultStaleTime` (Router prop) → the loader
  does not re-run; revisits are instant.
- Router-level defaults: `defaultStaleTime`, `defaultRetry`, `defaultMinLoaderDuration`
  (minimum pending time — prevents skeleton flashing on fast loaders), `maxCacheSize`
  (LRU-style eviction), `gcTime` on routes for idle eviction.
- `revalidateOnFocus` / `revalidateOnReconnect` revalidate the active route in the
  background.

## Loading UX pipeline

Deciding what to render while a navigation loads, in priority order:

| Condition | Rendered | Status |
| --- | --- | --- |
| Cache has the exact `path + search` key (`optimistic: true`) | cached data of the **new** key, revalidated in background | `optimistic` |
| `keepPreviousData: true`, same element, previous data exists | previous data stays on screen | `pending` |
| otherwise | `loaderFallback` (or `defaultLoaderFallback`) | `pending` |
| loader or beforeLoad failed | `errorElement` | `error` |

`keepPreviousData` applies only when the pending navigation targets the same element
(identity from the routes config) and the previous `loaderState` has data — e.g. changing
table filters. A failed loader always replaces kept data with `errorElement`.

A pending status is still reported by `useRouteStatus()` — use it for badges instead of
blocking the table (an "updating…" chip that shifts layout is an anti-pattern here).

## Reading data

```tsx
const { data, loaderError, beforeLoadError } = useLoaderState<T>();
const status = useRouteStatus(); // 'idle' | 'pending' | 'active' | 'optimistic' | 'error'
```

`data` is committed together with its status: during `pending` the store keeps the
previous route's `loaderState` until the new one is committed. Do not assume `data`
belongs to the current URL unless `status` is `active`/`optimistic` (or the route
committed with `keepPreviousData` — then the mismatch is intentional and flagged).
