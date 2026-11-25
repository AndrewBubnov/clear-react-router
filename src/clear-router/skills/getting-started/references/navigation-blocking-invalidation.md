# Navigation, blocking, invalidation, actions

## useNavigate

```tsx
const navigate = useNavigate();
navigate('/users/42');                       // string ('-1' = history back)
navigate({ pathname: '/users', search: '?sort=asc' });
navigate({ path: '/users/:userId', params: { userId: '42' } }); // typed
navigate(-1);                                // browser back
```

`search` carries its leading `?` everywhere downstream (Location, cache keys). Same
`path + search` navigations are skipped: nothing is pushed and no loader runs.

## Blocking (useBlocker)

```tsx
const { state, process, reset } = useBlocker(() => dirty);
// state: 'unblocked' → 'charged' (armed) → 'blocked' (a navigation was intercepted)
```

The callback receives `{ location, nextLocation, context }` and returns whether navigation
should be blocked — re-evaluated on every render, so plain booleans work. When armed,
the next navigation (links, programmatic, browser Back) suspends; show a dialog on
`state === 'blocked'`, then `process()` to continue to the target or `reset()` to stay
armed. Use for dirty forms.

## Invalidation (useInvalidate)

```tsx
const invalidate = useInvalidate();
await invalidate();                 // current route
await invalidate('/users');         // concrete path
await invalidate('/users/:id');     // pattern → every matching cache entry
await invalidate('/users', { withChildren: true });
await invalidate(undefined, { staleOnly: true }); // mark stale, refetch lazily
```

Invalidation deletes the cache entry and re-runs the loader; only the result matching
the currently active `pathname + search` updates the on-screen loader state. Use for
post-mutation refreshes; `useSubmitAction` triggers dependent invalidations
automatically.

## Prefetch

Router prop `defaultPrefetch: 'hover' | 'viewport' | 'none'` (device-aware default).
`<Link>` options: `prefetch` (per-link override), `hoverPrefetchDelay` (ms),
`preloadElement` runs the lazy import early. Concurrency: 4 desktop / 2 mobile.
A prefetch is never a superseder: it rides an already running flight for the same key
and never aborts it — safe to hover aggressively.

## Actions (mutations)

```tsx
// Route config
actions: ({ params, context, setContext, location }) => ({
	saveNote: async data => { ... },
}),
// Component — one hook per action
const { submit, isSubmitting, data, error } = useSubmitAction('saveNote');
submit(payload);   // runs the action, then invalidates affected cache
const saveNote = useAction('saveNote', { onSuccess, onError }); // raw call
```

Actions are route-owned mutations; after a successful action the affected loader data is
invalidated so the UI reflects the mutation without manual refreshes.

## Scroll restoration

`scrollRestoration: true` (window) or an array of container ids (`'feed'`, `'gallery'`).
Router prop `defaultScrollRestorationBehavior: 'auto' | 'smooth'`. Paired with the
browser history so Back restores the scroll position of the previous entry.
