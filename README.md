[![npm version](https://badge.fury.io/js/clear-react-router.svg)](https://www.npmjs.com/package/clear-react-router)

# Clear Router

A lightweight, type-safe routing library for client side React applications with nested routes, data loading, navigation blocking, prefetching, and route actions.

## Why Clear Router?

Most React routers focus on flexibility and ecosystem integrations. Clear Router focuses on predictable navigation with a small, explicit API and minimal setup.

There is no `RouterProvider` or provider hierarchy to manage. Simply render `<Router />` once, and use router hooks anywhere in your application.

It provides first-class support for:

* Predictable routing
* Built-in data loading
* Route actions and forms
* Simple, provider-free architecture
* Small, explicit API


## Features

- **Nested Routes** - Organize your UI with nested layouts and routes
- **Data Loading** - Built-in loaders with TTL-based caching (`staleTime`)
- **Navigation Blocking** - Prevent accidental navigation with `useBlocker`
- **Smooth Animations** - Page transitions with fade effect (customizable duration)
- **Static Layout** — Keep navbar, footer, and other elements outside the router to avoid unnecessary re-renders
- **Programmatic Redirects** - Redirect from beforeLoad hook
- **Cache invalidation** - Manual route invalidation
- **Bounded Cache** - Automatically evicts least recently used entries once `maxCacheSize` is reached, keeping memory usage predictable in long sessions
- **Prefetching** - Preload data on hover for instant navigation
- **Lazy Loading** - Code-split your routes with dynamic imports for optimal performance
- **Scroll Restoration** — Automatically saves and restores scroll position when navigating back to a page (preserves user's scroll position)
- **Optimistic navigation** — Instantly renders stale cached data while fresh data is loaded in the background.
- **Browser History** - Full support for browser back/forward buttons
- **Context-aware** - Pass and update context through routes

## API

### `Router`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routes` | `RouteItem[]` | required | Array of route configurations |
| `maxCacheSize` | `number \| undefined` | 60 for mobile, 150 for desktop | Maximum number of cached loader entries. Once the limit is reached, the least recently used entries are evicted |
| `isAnimated` | `boolean \| undefined` | `false` | Enable smooth page fade transitions |
| `animationDuration` | `number` | `optional` | Animation duration in milliseconds (browser default is used if not set) |
| `optimisticSpinner` | `boolean \| undefined` | `true` | Show a small spinner in the corner while optimistic route data revalidates in the background |
| `context` | `object` | `{}` | Initial context (user, theme, etc.) |
| `errorBoundary` | `ComponentType<{ children: ReactNode }>` | `undefined` | Custom error boundary component for catching render errors in route components |
| `defaultMinLoaderDuration` | `number \| undefined` | `0` | Default minimum time the loader fallback stays visible, to avoid flickering |
| `defaultLoaderFallback` | `ReactElement \| () => ReactElement` | `optional` | Default loading fallback for every route loader |
| `defaultErrorElement` | `ReactElement \| () => ReactElement` | `optional` | Default error fallback for every route |
| `defaultRetry` | `number \| { count: number; delay: number }` | `optional` | Default cache revalidation retry policy for all routes |
| `defaultStaleTime` | `number` | `optional` | Default time in milliseconds before cached loader data is considered stale |
| `defaultBeforeLoad` | `({ params, context, redirect, setContext, location }) => Promise<unknown> \| undefined \| void` | `undefined` | Runs before every navigation. Useful for authentication, analytics, or updating shared context.            |
| `defaultAfterLoad`  | `({ params, context, setContext }) => Promise<void>`  | `undefined` | Runs after every successful navigation. Useful for analytics, page tracking, or other global side effects. |
| `defaultPreserveScroll` | `boolean \| undefined` | `true` | Default value for save and restore scroll position when navigating between pages |
| `defaultPrefetch` | `'hover' \| 'render' \| 'viewport' \| 'none'` | `'hover'` for desktop, `'viewport'` for mobile | Default prefetch strategy for all `<Link>` components |
| `defaultHoverPrefetchDelay` | `number` | `150` | Default delay in milliseconds before prefetching on hover (only for `'hover'` strategy) |


> **Note:** Global lifecycle hooks wrap every route navigation. The global `defaultBeforeLoad` runs **before** the route-specific beforeLoad, while the global `defaultAfterLoad` runs **after** the route-specific afterLoad.

### `createRouter(routes)`

Normalizes route configuration. Extracts dynamic params, builds nested paths.

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path, e.g., `/user/:userId` |
| `element` | `ReactElement \| () => ReactElement \| LazyComponent` | Component to render |
| `beforeLoad` | `({ params, context, redirect, setContext, location }) => Promise<unknown> \| undefined \| void` | Runs before every route navigation. Auth checks and redirects. Can update context via `setContext`. `redirect` is provided by the router |
| `loader` | `({ params, context, setContext, searchParams, signal }) => Promise<unknown>` | Fetch data using route params, search params, abort controller signal and context. Can update context via `setContext` |
| `afterLoad` | `({ params, context, setContext }) => Promise<void>` | Runs after a successful navigation once the route has finished loading. Analytics, side effects after data is loaded. Can update context via `setContext` |
| `minLoaderDuration` | `number \| undefined` | `undefined` | Minimum time the loader fallback stays visible, to avoid flickering |
| `fallback` | `ReactElement \| () => ReactElement` | Loading fallback (for lazy loading) |
| `loaderFallback` | `ReactElement \| () => ReactElement` | Loading fallback for the route's `loader`. Overrides the global `defaultLoaderFallback` set in `Router` |
| `retry` | `number \| { count: number; delay: number }` | Overrides the global cache revalidation retry policy for this route |
| `optimistic` |  `boolean \| undefined` | Instant navigation using stale data while fresh data is loaded in the background |
| `errorElement` | `ReactElement \| () => ReactElement` | Error fallback for the route. Overrides the global `defaultErrorElement` set in `Router` |
| `staleTime` | `number` | Time in milliseconds before cached loader data is considered stale. Overrides Router.defaultStaleTime. If neither value is provided, cached data never expires |
| `actions` | `({ params, context, invalidate, setContext }) => Record<string, (formData: FormData) => unknown \| Promise<unknown>>` | Defines route actions for data mutations. Actions receive `FormData`, can update context via `setContext`, and can invalidate cached loader data using the router-provided `invalidate` |
| `pollingInterval` | `number \| undefined` | Polling interval (in milliseconds) for automatically revalidating data while the route is active |
| `preserveScroll` | `boolean \| undefined` | Save and restore route scroll position when navigating between pages |

Before load arguments (see [`redirect`](#redirect) for details on programmatic redirects):

`beforeLoad` and `loader` both receive:

```ts
{
  params: Record<string, string>;                                // Route parameters
  context: Record<string, unknown>;                              // Router context
  setContext: Dispatch<SetStateAction<Record<string, unknown>>>; // Updates the router context
  searchParams: Record<string, string>;                          // URL search parameters
  location: Location;                                            // Route location
}
```

`beforeLoad` additionally receives:
```ts
{
  redirect: (arg: Location | string) => Promise<void>;           // Programmatic redirection, see [redirect](#redirect)
}
```

`loader` additionally receives:
```ts
{
  signal: AbortSignal;                                           // Aborted if a newer navigation supersedes this one — pass to fetch() to cancel in-flight requests
}
```

### `Link`

Component for client-side navigation with prefetch support, active state detection, and pending state styling. Prefetch includes lazy route component preload.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `to` | `string` | required | Target path |
| `search` | `string \| undefined` | `undefined` | Query string appended to the target path |
| `state` | `unknown` | `undefined` | Arbitrary value attached to the navigation entry |
| `as` | `(props: ElementProps<T>, state: { isActive: boolean; isPending: boolean }) => ReactElement` | renders `<a>` | Render function for using a custom element/component instead of the default <a>. Receives the props to spread onto your element (href, ref, event handlers, className, style, children) as the first argument, and `{ isActive, isPending }` as a separate second argument — kept separate so these values are never accidentally forwarded to the DOM |
| `exact` | `boolean` | `false` | When `false`, the link is also considered active if the current URL starts with `to` (useful for nested routes) |
| `prefetch` | `'hover' \| 'render' \| 'viewport' \| 'none'` | `Router` config | Override the global prefetch strategy |
| `hoverPrefetchDelay` | `number` | `Router` config | Override the global hover delay |
| `children` | `ReactNode` | required | Content to render inside the link |
| `className` | `string \| ({ isActive, isPending }) => string` | `undefined` | CSS class name(s). Can be a function for dynamic styling |
| `style` | `CSSProperties \| ({ isActive, isPending }) => CSSProperties` | `undefined` | Inline styles. Can be a function for dynamic styling |
| `activeClassName` | `string` optional | `'active-link'` | Class name applied when the link matches the current URL |
| `pendingClassName` | `string` optional | `'pending-link'` | Class name applied when the link's target is loading |
| `beforeNavigate` | `() => Promise<void> \| undefined` | `undefined` | Callback fired before navigation |

**State values:**

| State | Type | Description |
|-------|------|-------------|
| `isActive` | `boolean` | `true` when the link's `to` matches the current URL considering `exact` value |
| `isPending` | `boolean` | `true` when the target route is currently loading (loader is running) |

### Prefetch Strategies

| Strategy | Behavior |
|----------|----------|
| `'hover'` | Prefetches when the user hovers over the link (with configurable delay) |
| `'render'` | Prefetches immediately when the link is rendered |
| `'viewport'` | Prefetches when the link enters the viewport (using Intersection Observer) |
| `'none'` | No prefetching |

### Custom elements via `as`

When using `as` to render a custom component instead of the default `<a>`, your component **must spread all received props onto the underlying host element** — including `ref`. If any prop is dropped, the corresponding feature silently stops working (no error is thrown):

- Missing `ref` → `viewport` prefetch never triggers (the `IntersectionObserver` has nothing to observe).
- Missing `onClick` → navigation doesn't happen, the link just does nothing.
- Missing `onMouseEnter`/`onMouseLeave` → `hover` prefetch doesn't trigger.
- Missing `href` → the link isn't reachable via keyboard, screen readers, "open in new tab", etc.

```tsx
// ✅ correct — every prop is forwarded to the host element
const Button = ({ children, ...props }: ElementProps<HTMLButtonElement>) => (
  <button {...props}>{children}</button>
);

// ❌ wrong — ref, event handlers, and href are silently dropped
const Button = ({ children }: { children: ReactNode }) => (
  <button>{children}</button>
);
```

If you only want to add or override specific props (e.g. add a `variant`), spread the received props first, then apply your own on top:

```tsx
const Button = ({ children, ...props }: ElementProps<HTMLButtonElement>) => (
  <button {...props} className={`btn ${props.className ?? ''}`}>
    {children}
  </button>
);
```

> **Note:** Because `as` is called as a plain function rather than rendered via JSX, avoid using React hooks (`useState`, `useEffect`, etc.) inside the function you pass to `as` — it isn't tracked by React as a separate component in the fiber tree. A function written for `as` (like `Button` above, which takes a second `state` argument) also isn't a valid standalone React component and shouldn't be rendered directly as `<Button />` elsewhere.

**Example:**

```tsx
import { Link, type ElementProps } from 'clear-react-router';

const Button = (
  { children, ...rest }: ElementProps<HTMLButtonElement>,
  { isActive }: { isActive: boolean }
) => (
  <button {...rest} style={{ background: isActive ? 'tomato' : 'green' }}>
    {children}
  </button>
);

<Link to="/about" as={Button}>To about page</Link>

For third-party components (MUI, Chakra, etc.), wrap them in an inline arrow function — most of them accept a
single `props` argument and forward it to the host element themselves:

import { Button } from '@mui/material';

<Link
  to="/about"
  as={(props, { isActive }) => <Button {...props} variant={isActive ? 'contained' : 'text'} />}
>
  To about page
</Link>
```
```tsx
// Global prefetch: hover with 100ms delay
<Router routes={routes} prefetch="hover" hoverPrefetchDelay={100} />

// Override for a specific link
<Link to="/heavy-page" prefetch="viewport">
  Heavy Page
</Link>

// Disable prefetch for a specific link
<Link to="/admin" prefetch="none">
  Admin Panel
</Link>

// With custom active/pending classes
<Link to="/settings" activeClassName="active-nav-link" pendingClassName="loading-nav-link">
  Settings
</Link>

// With dynamic className
<Link to="/dashboard" className={({ isActive, isPending }) => isActive ? 'text-blue-600' : isPending ? 'text-gray-400' : 'text-gray-600'}>
  Dashboard
</Link>

// With dynamic style
<Link to="/profile" style={({ isActive }) => ({ fontWeight: isActive ? 'bold' : 'normal' })}>
  Profile
</Link>

// Use `beforeNavigate`
<Link to="/details" beforeNavigate={saveDashboardData}>
  Admin Panel
</Link>

// `exact={false}` — active for nested routes too
// e.g. active when current URL is "/settings" or "/settings/profile"
<Link to="/settings" exact={false}>
  Settings
</Link>
```
**Important**: prefetch="render" should be used sparingly, as it preloads data immediately when the link is rendered, which may cause unnecessary network requests.

## Retry

Sometimes a request may fail because of a temporary network issue or a short-lived server problem. Instead of immediately rendering the error state, you can configure the router to automatically retry loading route data.

### Route-level retry

```tsx
{
  path: '/posts',
  loader: loadPosts,
  retry: 3,
}
```

`retry: 3` means the router will make up to **3 additional attempts** after the initial failed request (up to **4 attempts** in total).

You can also specify a delay between attempts:

```tsx
{
  path: '/posts',
  loader: loadPosts,
  retry: {
    count: 3,
    delay: 500,
  },
}
```

### Global retry

To apply the same retry policy to all routes, use `defaultRetry`:

```tsx
<Router routes={routes} defaultRetry={2} />
```

or with a delay:

```tsx
<Router routes={routes} defaultRetry={{ count: 2, delay: 500 }} />
```

A route-level `retry` always overrides `defaultRetry`.

### How it works

Unlike many routing libraries, retry is **not limited to the initial loader execution**.

The retry policy is applied to the router's **cache revalidation mechanism**, so it automatically works for every operation that reloads route data, including:

* Initial route loading
* Cache revalidation
* `invalidate()`
* `prefetch()`

This ensures consistent behavior regardless of how the data is being refreshed.

### Why?

The router treats the route loader as the single source of truth for route data. Since every data refresh goes through the same cache revalidation pipeline, retry is configured once and automatically applies everywhere without any additional code.

### `redirect`

Function provided to `beforeLoad` for programmatic redirection.

**Type:** `(arg: Location | string) => Promise<void>`

```tsx
import type { createRouter } from 'clear-react-router';

const routes = createRouter([
  {
    path: '/dashboard',
    element: <Dashboard />,
    beforeLoad: ({ context, redirect }) => {
      if (!context.isAuthorized) return redirect('/');
    },
  },
]);

const routes = createRouter([
  {
    path: '/dashboard',
    element: <Dashboard />,
    beforeLoad: ({ context, redirect }) => {
      if (!context.isAuthorized) return redirect({ pathname: '/login', state: { from: '/dashboard' } });
    },
  },
]);

const routes = createRouter([
  {
    path: '/user/:userId',
    loader: async ({ params, context, setContext }) => {
      const user = await fetchUser(params.userId);
      setContext({ ...context, currentUser: user });
      return { user };
    },
    beforeLoad: async ({ context, setContext, redirect }) => {
      if (!context.token) return redirect('/login');
      setContext({ ...context, lastVisit: Date.now() });
    },
  }
]);
 
```

### Usage with Parameters

The `loader`, `beforeLoad`, and `afterLoad` hooks receive `params` (extracted from the URL) and `context` as arguments. This allows you to handle route-specific logic directly in the route configuration, keeping your components focused on rendering.

```tsx
import type { createRouter } from 'clear-react-router';

const routes = createRouter([
  {
    path: '/user/:userId',
    element: <UserProfile />,
    loader: async ({ params, context }) => {
      // params.userId is available from the URL
      const user = await fetchUser(params.userId);
      return { user };
    },
    beforeLoad: async ({ params, context, redirect }) => {
      // Authentication check
      if (!context.isAuthorized) {
        return redirect('/login');
      }
      // Validate parameter
      if (!params.userId || !isValidUserId(params.userId)) {
        return redirect('/users');
      }
    },
    afterLoad: ({ params, context }) => {
      // Analytics or side effects
      console.log(`User ${params.userId} loaded`);
    },
  },
]);
```

## Route Actions

Defines route-specific actions for handling data mutations such as creating, updating, or deleting resources.

Actions are available through the `Form` component and the `useAction` hook. After a successful action, the current route is automatically invalidated, causing both `beforeLoad` and `loader` to run again in the background.

```tsx
actions?: ({ context, params, invalidate, setContext }) => ({
  save: async (formData) => {
    await api.updatePost(params.id, formData);
  },

  remove: async () => {
    await api.deletePost(params.id);
  },
})
```

#### Arguments

| Property     | Type                                                | Description                                                                                  |
| ------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `context`    | `Record<string, unknown>`                           | Current router context.                                                                      |
| `params`     | `Record<string, string>`                            | Route parameters.                                                                            |
| `invalidate` | `(path?: string) => Promise<void>`                  | Invalidates the current route or a specific route, re-running its `beforeLoad` and `loader`. |
| `setContext` | `Dispatch<SetStateAction<Record<string, unknown>>>` | Updates the router context.                                                                  |

#### Returns

A record where each key is an action name and each value is a function accepting a `FormData` instance.

These action names are referenced by both `Form` and `useAction`.

```tsx
<Form action="save" />

const save = useAction('save');
```


Actions can be executed declaratively with `<Form />` or imperatively with `useAction()`.

## Form

`Form` automatically creates a `FormData` object on submit event, executes the specified route action, invalidates the current route, and optionally resets the form, if fields are uncontrolled.

`isSubmitting` value available inside the `Form` component from the `useFormContext` hook

```tsx
import { Form, useFormContext } from 'clear-react-router';

const SubmitButton = () => {
	const {isSubmitting} = useFormContext()
	return <button disabled={isSubmitting} type='submit'>Save</button>
}

<Form action="save" onSuccess={() => console.log('Saved')} onError={console.error}>
  <input name="title" />
  <SubmitButton />
</Form>

```

### Props

| Prop        | Type                        | Description                                                                      |
| ----------- | --------------------------- | -------------------------------------------------------------------------------- |
| `action`    | `string`                    | Name of the route action to execute.                                             |
| `onSuccess` | `(result: unknown) => void` | Called when the action completes successfully. Receives the action return value. |
| `onError`   | `(error: unknown) => void`  | Called when the action throws.                                                   |
| `autoReset` | `boolean`                   | Automatically resets the form after a successful submission. Default: `true`.    |

During submission, `Form` exposes the current submission state through `useFormContext()`.

After a successful action:

* the current route is invalidated;
* `beforeLoad` is executed again;
* `loader` is executed again;
* fresh loader data becomes available.

## useAction

`useAction` provides direct access to a route action without rendering a `<Form />`.

### Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `action` | `string` | Name of the route action to execute. Must match a key returned from the route's `actions` configuration. |
| `options` | `{ onSuccess?, onError? }` | Optional callbacks invoked after the action succeeds or fails. |

```tsx
const save = useAction('save');

const handleClick = async () => {
  const data = new FormData();
  data.append('title', 'Hello');
  await save(data);
};

<button onClick={handleClick}>Save</button>
```

`useAction` automatically invalidates the current route after a successful action, causing both `beforeLoad` and `loader` to run again in the background.

This hook is useful when the mutation is triggered programmatically, such as from dialogs, context menus, drag-and-drop interactions, keyboard shortcuts, or custom UI components.


### Error Boundaries

You can provide a custom error boundary to catch rendering errors in route components. This is useful for preventing the entire app from crashing when a specific route fails to render.

```tsx
import { Router } from 'clear-react-router';
import { routes } from './routes';
import { ErrorBoundary } from './components/ErrorBoundary';

const App = () => <Router routes={routes} errorBoundary={ErrorBoundary} />
```
**Note:** The `errorBoundary` prop only catches render-time errors in route components. It does not catch errors in `loader` or `beforeLoad` — those are handled by the router's `errorElement` mechanism.

## Hooks

### `useNavigate()`

Returns function to navigate programmatically. Accepts a string (pathname), an object of type Location, or `-1` to go back.

```tsx
type Location = { pathname: string;	search?: string; state?: unknown }

const navigate = useNavigate();

navigate('/about');                                           // string
navigate({ pathname: '/user/123', state: { from: 'home' } }); // Location
navigate(-1);                                                 // go back
```

**Note:** Navigation state can be accessed via `useLocation()`:

```tsx
const navigate = useNavigate();
navigate({ pathname: '/profile', state: { userId: 123 } });

// In Profile component
const { state } = useLocation();
console.log(state); // { userId: 123 }
```

### `useParams<T>()`

Returns route parameters object.

```tsx
const params = useParams<{ userId: string }>();
// URL: /user/123 → params.userId === '123'
```

### `useLocation()`

Returns current location `{ pathname, search, state }`.
```tsx
const { pathname, search, state } = useLocation();
```

### `useLoaderState<T>()`

Returns the cached data loaded by the current route's `loader`, along with any errors from `loader` or `beforeLoad`. Data is automatically cached and reused when navigating back to the same route.

**Returns:**

| Property | Type | Description |
|----------|:----:|-------------|
| `data` | `T` | The data returned from the route's `loader` |
| `loaderError` | `Error \| null` | Error from the `loader` (if any) |
| `beforeLoadError` | `Error \| null` | Error from the `beforeLoad` hook (if any) |

```tsx
const UserProfile = () => {
  const { data, loaderError, beforeLoadError } = useLoaderState<User>();
```

### Caching behavior:

- The loader result is cached and reused when navigating back to the same route (e.g., from /user/123 back to /user/456 it will be a new request because different params, but from /user/456 to /user/456 — cache hit).
- Use `staleTime` in route config to control how long cache is considered fresh:

```tsx
{
  path: '/user/:userId',
  loader: async ({ params }) => fetchUser(params.userId),
  staleTime: 60000, // 1 minute — cache is fresh for 60 seconds
}
```

- Stale entries are cleaned up on every navigation, so cache growth stays tied to how often you actually revisit stale data — not to how long the session lasts.
- On top of that, the cache is bounded by `maxCacheSize` — once the limit is reached, the least recently used entry is evicted to make room for a new one, regardless of whether it's still fresh. This caps memory usage for apps with many high-cardinality dynamic routes (e.g. `/product/:id` across a large catalog). It defaults to a device-aware value (lower on mobile) and can be overridden on the `Router`:

```tsx
<Router routes={routes} maxCacheSize={200} />
```


### `useInvalidate()`

Returns a function that revalidates **cached** route data. Calling `invalidate()` clears cached route data and immediately runs the corresponding route loader again.

#### Current route

Revalidate the currently active route:

```tsx
const invalidate = useInvalidate();

await invalidate();
```

#### Specific route

Revalidate any registered route by passing its pathname:

```tsx
await invalidate('/posts');
```

#### Multiple routes

You can revalidate several routes at once by passing an array of pathnames:

```tsx
await invalidate(['/posts', '/profile', '/settings']);
```

#### Dynamic routes

When a dynamic route pattern is provided, every cached route that matches the pattern will be revalidated.

For example:

```tsx
await invalidate('/post/[id]');
```

will revalidate all cached routes such as:

```text
/post/1
/post/17
/post/42
```

This also works for nested dynamic routes:

```tsx
await invalidate('/post/[id]/comment/[id]');
```

#### Force revalidation
By default only paths that already exist in the cache are revalidated.
Pass `{ force: true }` to also revalidate the exact path(s) you passed, even if they were never cached:

```tsx
await invalidate('/about', { force: true });
await invalidate(['/about', '/post/10'], { force: true });
```

#### Including child routes

To revalidate routes together with their cached child routes, pass the `withChildren` option:

```tsx
await invalidate('/posts', { withChildren: true });
await invalidate(['/posts', '/users'], { withChildren: true });
```

This will recursively revalidate all cached child routes.

For example, if the following routes have been visited:

```text
/posts
/post/17
/post/23
/post/42/comments
```

then:

```tsx
await invalidate('/posts', { withChildren: true });
```

will revalidate the cached child routes:

```text
/post/17
/post/23
/post/42/comments
```
#### Including `beforeLoad`

To include the `beforeLoad` function in the revalidation process, pass the `withBeforeLoad` option:

```tsx
await invalidate('/posts', { withBeforeLoad: true });
await invalidate(['/posts', '/users'], { withBeforeLoad: true });
```

#### Returns

An array of objects with the following structure:
```ts
{ path: string; data: unknown; error: unknown }
```
Each object represents a revalidated route, where `path` is the route pathname, `data` is the revalidated loader result, and `error` is the loader error, if any.

#### Notes

* Without `force` option, **only routes that already have cached data** are revalidated.
* With `force: true`, the exact pathnames you pass are always revalidated (and stored in the cache).
* Cached data is cleared before the new loader starts.
* When used as an event handler, wrap the call in an arrow function:

```tsx
<button onClick={() => invalidate()}>Refresh</button>
```

Passing `invalidate` directly (`onClick={invalidate}`) is not supported because React passes a `MouseEvent` object to event handlers.


### `useBlocker(callback)`

Blocks navigation when callback returns `true`.

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `state` | `'unblocked' \| 'charged' \| 'blocked'` | Current blocker state |
| `process()` | `() => void` | Confirm navigation and proceed |
| `reset()` | `() => void` | Cancel navigation |

```tsx
const { state, process, reset } = useBlocker(() => hasUnsavedChanges);

useEffect(() => {
  if (state === 'blocked') {
    // Show your custom modal
    if (confirm('Leave without saving?')) {
      process();
    } else {
      reset();
    }
  }
}, [state, process, reset]);
```

### `useIsDataLoading()`

Returns a boolean indicating whether any route loader is currently fetching data. Useful for global loading indicators (progress bar, spinner in the layout, etc.).

### `useRouterContext()`

Returns the router context object and a function to update it. Useful for accessing or modifying global state (like user authentication, theme, etc.) from anywhere in your app.
```tsx
const { setContext, context } = useRouterContext();
const loginHandler = () => setContext({ ...context, user: { name: 'John' } });
```

### `useSearchParams()`

Returns an object for working with URL query parameters. Supports reading and setting both single values and arrays.

```tsx
import { useSearchParams } from 'clear-react-router';

function ProductFilter() {
  const { searchParams, getSearchParams, setSearchParams } = useSearchParams();

  // Get a single value or array
  const brand = getSearchParams('brand'); // 'nike' | ['nike', 'reebok'] | ''

  // Set a single value
  setSearchParams('brand', 'nike'); // ?brand=nike

  // Set multiple values (array)
  setSearchParams('brand', ['nike', 'reebok']); // ?brand=nike&brand=reebok

  // Functional update (preserves other params)
  setSearchParams((prev) => {
    prev.set('page', '2');
    prev.append('color', 'red');
    return prev;
  });

  // Direct access to URLSearchParams
  const allParams = searchParams.toString(); // "brand=nike&brand=reebok&page=2"
}
```
**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `searchParams` | `URLSearchParams` | Raw `URLSearchParams` object for low-level access |
| `getSearchParams` | `(key: string) => string \| string[]` | Returns a single value or an array if multiple values exist for the key |
| `setSearchParams` | `(param: string, value: string \| string[]) => void` `or` `(updater: (prev: URLSearchParams) => URLSearchParams) => void` | Update query parameters. Supports single values, arrays, or functional updates |

**Key features:**

- **Array support** — `getSearchParams` returns `string[]` when multiple values exist for the same key
- **Functional updates** — Update parameters based on previous state without losing other params
- **Stable reference** — `setSearchParams` reference is stable and safe to use in `useEffect`

> **Note:** `getSearchParams` returns `string` for single values, `string[]` for multiple values, and `''` if the key is not found.

## Lazy Loading

Clear Router supports code-splitting out of the box. Simply wrap dynamic import into a library's `lazy` function:
```tsx
import { lazy } from 'clear-react-router';

{
  path: '/heavy-page',
  element: lazy(() => import('./pages/HeavyComponent')),
  fallback: () => <div>Loading...</div>,
}
```
## Animations

Clear Router supports smooth page transitions using the native View Transitions API. When animations are enabled, the router waits for all data to load before starting the transition, ensuring a jank-free experience.

## How It Works

- **Data loads first** — All `loader` and `beforeLoad` hooks complete before animation starts
- **Native API** — Uses `document.startViewTransition` for smooth, hardware-accelerated animations

## Browser Support

View Transitions API requires modern browsers:

- Chrome/Edge 111+
- Safari 18+
- Firefox 144+

For older browsers, the router gracefully falls back to regular navigation without animation.

## Requirements
- React 16.6+ (for React.lazy and Suspense)
- Use `default` export for your lazy-loaded components

 ## License
 MIT
