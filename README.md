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
- **Data Loading** - Built-in loaders with caching and stale-while-revalidate strategy
- **Navigation Blocking** - Prevent accidental navigation with `useBlocker`
- **Smooth Animations** - Page transitions with fade effect (customizable duration)
- **Static Layout** — Keep navbar, footer, and other elements outside the router to avoid unnecessary re-renders
- **Programmatic Redirects** - Redirect from beforeLoad hook
- **Cache invalidation** - Manual route invalidation
- **Prefetching** - Preload data on hover for instant navigation
- **Lazy Loading** - Code-split your routes with dynamic imports for optimal performance
- **Scroll Restoration** — Automatically saves and restores scroll position when navigating back to a page (preserves user's scroll position)
- **Typed Query Param** — Type-safe reading and writing of URL query parameters with built-in parsers for strings, numbers, booleans, arrays, and Zod schemas
- **Flexible API** - Use components or hooks as you prefer
- **Browser History** - Full support for browser back/forward buttons
- **Context-aware** - Pass and update context through routes

## API

### `createRouter(routes)`

Normalizes route configuration. Handles wildcard `*` routes, extracts dynamic params, builds nested paths.

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path, e.g., `/user/:userId` |
| `element` | `ReactElement \| () => ReactElement \| LazyComponent` | Component to render |
| `beforeLoad` | `({ params, context, redirect, setContext }) => Promise<unknown> \| undefined \| void` | Auth checks and redirects. Can update context via `setContext`. `redirect` is provided by the router |
| `loader` | `({ params, context, setContext }) => Promise<unknown>` | Fetch data using route params and context. Can update context via `setContext` |
| `afterLoad` | `({ params, context, setContext }) => Promise<void>` | Analytics, side effects after data is loaded. Can update context via `setContext` |
| `fallback` | `ReactElement \| () => ReactElement` | Loading fallback (for lazy loading) |
| `loaderFallback` | `ReactElement \| () => ReactElement` | Loading fallback for the route's `loader`. Overrides the global `defaultLoaderFallback` set in `Router` |
| `errorElement` | `ReactElement \| () => ReactElement` | Error fallback for the route. Overrides the global `defaultErrorElement` set in `Router` |
| `staleTime` | `number` | Time in ms before cached data is considered stale and re-fetched in the background. If not provided, data never expires (cached forever) |
| `actions` | `({ params, context, invalidate, setContext }) => Record<string, (formData: FormData) => unknown \| Promise<unknown>>` | Defines route actions for data mutations. Actions receive `FormData`, can update context via `setContext`, and can refresh loader data using the router-provided `invalidate`. |

### `Router`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routes` | `RouteItem[]` | required | Array of route configurations |
| `isAnimated` | `boolean \| undefined` | `false` | Enable smooth page fade transitions |
| `animationDuration` | `number` | `optional` | Animation duration in milliseconds (browser default is used if not set) |
| `defaultLoaderFallback` | `ReactElement \| () => ReactElement` | `optional` | Default loading fallback for every route loader |
| `defaultErrorElement` | `ReactElement \| () => ReactElement` | `optional` | Default error fallback for every route |
| `beforeLoad` | `({ params, context, redirect, setContext }) => Promise<unknown> \| undefined \| void` | `undefined` | Runs before every navigation. Useful for authentication, analytics, or updating shared context.            |
| `afterLoad`  | `({ params, context, setContext }) => Promise<void>`  | `undefined` | Runs after every successful navigation. Useful for analytics, page tracking, or other global side effects. |
| `spinner` | `boolean \| undefined` | `true` | Show a small spinner in the corner while loading data (only when `isAnimated` is enabled) |
| `preserveScroll` | `boolean \| undefined` | `true` | Save and restore scroll position when navigating between pages |
| `showFallbackOnAnimation` | `boolean \| undefined` | `false` | Show `loaderFallback` even when `isAnimated` is `true` (instead of spinner) |
| `prefetch` | `'hover' \| 'render' \| 'viewport' \| 'none'` | `'hover'` | Default prefetch strategy for all `<Link>` components |
| `hoverPrefetchDelay` | `number` | `150` | Delay in milliseconds before prefetching on hover (only for `'hover'` strategy) |
| `context` | `object` | `{}` | Initial context (user, theme, etc.) |
| `errorBoundary` | `ComponentType<{ children: ReactNode }>` | `undefined` | Custom error boundary component for catching render errors in route components |

> **Note:** Global lifecycle hooks wrap every route navigation. The global beforeLoad runs **before** the route-specific beforeLoad, while the global afterLoad runs **after** the route-specific afterLoad.

```tsx
<div>
  <Navbar />
  <Router routes={routes} spinner={false} isAnimated />  {/* disable the spinner */}
</div>
```

> **Note:** When `isAnimated` is enabled, `loaderFallback` is not shown. Instead, a small spinner appears (if `spinner={true}`). On the initial page load, however, the route's loaderFallback is rendered if available.

### `Link`

Component for client-side navigation with prefetch support.

| Prop | Type | Default |
|------|------|---------|
| `to` | `string` | required |
| `prefetch` | `'hover' \| 'render' \| 'viewport' \| 'none'` | `Router` config | Override the global prefetch strategy |
| `hoverPrefetchDelay` | `number` | `Router` config | Override the global hover delay |
| `children` | `ReactElement` | required | Content to render inside the link |

### Prefetch Strategies

| Strategy | Behavior |
|----------|----------|
| `'hover'` | Prefetches when the user hovers over the link (with configurable delay) |
| `'render'` | Prefetches immediately when the link is rendered |
| `'viewport'` | Prefetches when the link enters the viewport (using Intersection Observer) |
| `'none'` | No prefetching |

**Example:**

```tsx
import { Router, Link } from 'clear-react-router';

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
```
**Important**: prefetch="render" should be used sparingly, as it preloads data immediately when the link is rendered, which may cause unnecessary network requests.

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
- Use staleTime in route config to control how long cache is considered fresh:
```
{
  path: '/user/:userId',
  loader: async ({ params }) => fetchUser(params.userId),
  staleTime: 60000, // 1 minute — cache is fresh for 60 seconds
}
```

### `useInvalidate()`

Returns a function that revalidates cached route data by executing the route lifecycle again.

Calling `invalidate()` clears the cached loader result and immediately runs both `beforeLoad` and `loader` for the specified route. This is useful after mutations or any operation that changes data used by the route.

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
await invalidate([ '/posts', '/profile', '/settings' ]);
```

#### Dynamic routes

When a dynamic route pattern is provided, every cached route matching that pattern will be revalidated.

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

#### Including child routes

To revalidate a single route together with its cached child routes, pass the `withChildren` option:

```tsx
await invalidate('/posts', { withChildren: true }); // a route, not a route list
```

This will recursively revalidate cached routes inside the route tree.

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
#### Notes

* `invalidate()` re-executes both `beforeLoad` and `loader` for the invalidated route.
* Only routes that already have cached data are revalidated.
* Cached data is discarded before the new loader starts.
* When used as an event handler, wrap the call in an arrow function:

```tsx
<button onClick={() => invalidate()}>
	Refresh
</button>
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

### `useQueryParam()`

A flexible hook for working with typed query parameters. You provide an adapter object with `parse` and `serialize` functions, and it returns the parsed value and a setter.

```tsx
import { useQueryParam, adapter } from 'clear-react-router';

const ProductPage = () => {
  // String parameter
  const [brand, setBrand] = useQueryParam('brand', adapter.string, 'nike');

  // Number parameter
  const [page, setPage] = useQueryParam('page', adapter.integer, 1);

  // Date parameter
  const [date, setDate] = useQueryParam('date', adapter.date, new Date());

  // Array of numbers
  const [prices, setPrices] = useQueryParam('prices', adapter.floatArray);

  return (
    <div>
      <p>Brand: {brand}</p>
      <p>Page: {page}</p>
      <button onClick={() => setPage(page + 1)}>Next</button>
    </div>
  );
}
```
type Adapter<T> = {
	parse: (params: string[]) => T;
	serialize?: (params: T) => string | string[];
}

**Signature:** `useQueryParam<T>(field: string, adapter: Adapter<T>, defaultValue?: T): [T, (arg: T | null) => void]`

| Argument | Type | Description |
|----------|------|-------------|
| `field` | `string` | The query parameter key (e.g., `'page'`, `'brand'`) |
| `adapter` | `Adapter<T>` | Parser and optional serializer for params (serializer String is used in case of serializer not passed) |
| `defaultValue` | `T` (optional) | Default value returned when the parameter is missing or empty |

**Returns:**

| Element | Type | Description |
|---------|------|-------------|
| `value` | `T` | The parsed value from the query parameter |
| `setValue` | `(arg: T \| null) => void` | Function to update the query parameter. Null is passed to remove the parameter. |

### Built-in Adapters

| Adapter | Input | Output | Description |
|---------|-------|--------|-------------|
| `adapter.string` | `string[]` | `string` | First value or empty string |
| `adapter.stringArray` | `string[]` | `string[]` | All values as array |
| `adapter.integer` | `string[]` | `number` | First value parsed as integer (default: `0`) |
| `adapter.integerArray` | `string[]` | `number[]` | All values parsed as integers |
| `adapter.float` | `string[]` | `number` | First value parsed as float (default: `0`) |
| `adapter.floatArray` | `string[]` | `number[]` | All values parsed as floats |
| `adapter.boolean` | `string[]` | `boolean` | First value parsed as boolean (`'true'` → `true`) |
| `adapter.booleanArray` | `string[]` | `boolean[]` | All values parsed as booleans |
| `adapter.date` | `string[]` | `Date` | First value parsed as Date from timestamp |
| `adapter.dateArray` | `string[]` | `Date[]` | All values parsed as Dates from timestamps |
| `adapter.zodSchema` | `string[]` | `T` | Validates JSON string against Zod schema |

### Using Zod Schemas
`useQueryParam` works seamlessly with Zod for complex validation:

```tsx
import { z } from 'zod';
import { useQueryParam, adapter } from 'clear-react-router';

const filterSchema = z.object({
  name: z.string(),
  age: z.number().min(0),
  active: z.boolean().optional(),
});

function ProductFilter() {
  const [filter, setFilter] = useQueryParam(
    'filter',
    adapter.zodSchema(filterSchema),
    { name: '', age: 0 }
  );

  return (
    <div>
      <p>Name: {filter.name}</p>
      <p>Age: {filter.age}</p>
      <button onClick={() => setFilter({ ...filter, age: filter.age + 1 })}>
        Increment Age
      </button>
    </div>
  );
}
```

### Custom Adapters
You can write your own adapter for any format:

```tsx
// Custom adapter for comma-separated values
const csvAdapter = {
  parse: (params: string[]): string[] => {
    const value = params[0] || '';
    return value ? value.split(',').map(v => v.trim()) : [];
  },
  serialize: (value: string[]): string[] => value
}

const TagsFilter() {
  const [tags, setTags] = useQueryParam('tags', csvAdapter, []);
  // tags: string[]
}
```

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

Clear Router supports code-splitting out of the box. Simply pass a function that returns a dynamic import:
```tsx
{
  path: '/heavy-page',
  element: () => import('./pages/HeavyComponent'),
  fallback: () => <div>Loading...</div>,
}
```
## Animations

Clear Router supports smooth page transitions using the native View Transitions API. When animations are enabled, the router waits for all data to load before starting the transition, ensuring a jank-free experience.

## How It Works

- **Data loads first** — All `loader` and `beforeLoad` hooks complete before animation starts
- **No `loaderFallback`** — The `loaderFallback` is not shown during animated transitions
- **Subtle spinner** — A small spinner appears in the top-left corner while data is loading and `spinner` prop of `Router` component is on, so users know the app is responsive
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
