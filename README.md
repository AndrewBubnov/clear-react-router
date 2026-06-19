[![npm version](https://badge.fury.io/js/clear-react-router.svg)](https://www.npmjs.com/package/clear-react-router)

A lightweight, type-safe routing library for React applications with nested routes, data loading, navigation blocking, and prefetching.

## Features

- 🧩 **Nested Routes** - Organize your UI with nested layouts and routes
- ⚡ **Data Loading** - Built-in loaders with caching and stale-while-revalidate strategy
- 🔒 **Navigation Blocking** - Prevent accidental navigation with `useBlocker`
- ✨ **Smooth Animations** - Page transitions with fade effect (customizable duration)
- 🏗️ **Static Layout** — Keep navbar, footer, and other elements outside the router to avoid unnecessary re-renders
- 🎯 **Type-safe Redirects** - Redirect from loaders and beforeLoad hooks
- 📦 **Prefetching** - Preload data on hover for instant navigation
- 🚀 **Lazy Loading** - Code-split your routes with dynamic imports for optimal performance
- 🎨 **Flexible API** - Use components or hooks as you prefer
- 📱 **Browser History** - Full support for browser back/forward buttons
- 🧠 **Context-aware** - Pass and update context through routes

## API

### `createRouter(routes)`

Normalizes route configuration. Handles wildcard `*` routes, extracts dynamic params, builds nested paths.

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path, e.g., `/user/:userId` |
| `element` | `ReactElement \| () => ReactElement \| LazyComponent` | Component to render |
| `loader` | `({ params, context }) => Promise<unknown>` | Fetch data using route params and context |
| `beforeLoad` | `({ params, context, redirect }) => Promise<unknown> \| undefined` | Auth checks and redirects. `redirect` is provided by the router |
| `afterLoad` | `({ params, context }) => Promise<void>` | Analytics, side effects after data is loaded |
| `fallback` | `ReactElement \| () => ReactElement` | Loading fallback (for lazy loading) |
| `loaderFallback` | `ReactElement \| () => ReactElement` | Loading fallback (for loader) |
| `errorElement` | `ReactElement \| () => ReactElement` | Error fallback |
| `staleTime` | `number` | Time in ms before cached data is considered stale and re-fetched in the background. If not provided, data never expires (cached forever) |
| `children` | `RouteItem[]` | Nested routes |

### `RouterProvider`

The root component that provides routing context to the application. Place static UI elements (like navbar or footer) outside `<Router />` to prevent unnecessary re-renders.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routeList` | `RouteItem[]` | required | Array of route configurations |
| `context` | `object` | `{}` | Initial context (user, theme, etc.) |
| `isAnimated` | `boolean` | `false` | Enable smooth page transitions |
| `animationDuration` | `number` | `optional` | Animation duration in milliseconds (browser default is used if not set) |
| `children` | `ReactNode` | required | App content (must include `<Router />`) |

```
function App() {
  return (
    <RouterProvider routeList={routes} isAnimated animationDuration={800}>
      <Navbar />           {/* Static — won't re-render on route change */}
      <main>
        <Router />         {/* Dynamic — renders current page */}
      </main>
      <Footer />           {/* Static — won't re-render on route change */}
    </RouterProvider>
  );
}
```

### `Router`

Renders the current route's component. Must be placed inside `<RouterProvider>`.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spinner` | `boolean /| undefined` | `true` | Show a small spinner in the corner while loading data (only when `isAnimated` is enabled) |

```
<RouterProvider routeList={routes} isAnimated>
  <Navbar />
  <Router spinner={false} />  {/* disable the spinner */}
</RouterProvider>
```

> **Note:** When `isAnimated` is enabled, `loaderFallback` is not shown. Instead, a small spinner appears (if `spinner={true}`).

### `Link`

Component for client-side navigation with prefetch support.

| Prop | Type | Default |
|------|------|---------|
| `to` | `string` | required |
| `prefetch` | `boolean` | `true` |
| `children` | `ReactElement` | required |

### `redirect`

Function provided to `beforeLoad` for programmatic redirection.

**Type:** `(arg: Location | string) => Promise<void>`

```
import type { Location } from 'clear-react-router';

const routes = createRouter([
  {
    path: '/dashboard',
    element: <Dashboard />,
    beforeLoad: ({ context, redirect }) => {
      if (!context.isAuthorized) return redirect('/');
    },
  },
]);

or

const routes = createRouter([
  {
    path: '/dashboard',
    element: <Dashboard />,
    beforeLoad: ({ context, redirect }) => {
      if (!context.isAuthorized) return redirect({ pathname: '/login', state: { from: '/dashboard' } });
    },
  },
]);
 
```

### Usage with Parameters

The `loader`, `beforeLoad`, and `afterLoad` hooks receive `params` (extracted from the URL) and `context` as arguments. This allows you to handle route-specific logic directly in the route configuration, keeping your components focused on rendering.

```
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

## Hooks

### `useNavigate()`

Returns function to navigate programmatically. Accepts a string (pathname), an object with `pathname`, `search`, and `state`, or `-1` to go back.

```
const navigate = useNavigate();

navigate('/about');                                           // string
navigate({ pathname: '/user/123', state: { from: 'home' } }); // object
navigate(-1);                                                 // go back
```

**Note:** Navigation state can be accessed via `useLocation()`:

```
const navigate = useNavigate();
navigate({ pathname: '/profile', state: { userId: 123 } });

// In Profile component
const { state } = useLocation();
console.log(state); // { userId: 123 }
```

### `useParams<T>()`

Returns route parameters object.

```
const params = useParams<{ userId: string }>();
// URL: /user/123 → params.userId === '123'
```

### `useLocation()`

Returns current location `{ pathname, search, state }`.
```
const { pathname, search, state } = useLocation();
```

### `useLoaderState()`

Returns the cached data loaded by the current route's `loader`. Data is automatically cached and reused when navigating back to the same route.
```
const UserProfile = () => {
  const user = useLoaderState();
  return <div>{user.name}</div>;
}
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

### `useBlocker(callback)`

Blocks navigation when callback returns `true`.

**Returns:**

| Property | Type | Description |
|----------|------|-------------|
| `state` | `'unblocked' \| 'charged' \| 'blocked'` | Current blocker state |
| `process()` | `() => void` | Confirm navigation and proceed |
| `reset()` | `() => void` | Cancel navigation |

```
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

### `useBeforeUnload(callback?)`

Executes a callback when the page is about to be closed or reloaded. Perfect for auto-saving data at the last moment.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `() => void \| undefined` | Function to execute before page unload (e.g., auto-save) |

**Note:** This hook does not show a browser confirmation dialog. It silently executes the callback, allowing you to save user data in the background before the page closes.

```
const [text, setText] = useState('');
const onSave = useCallback(() => {
  localStorage.setItem('draft', text);
}, [text]);

// Auto-save when user tries to close/reload the page
useBeforeUnload(text ? onSave : undefined);
```
> **Note:** Pass `undefined` to disable the handler (e.g., if there is no changes).

### `useRouterContext()`

Returns the router context object and a function to update it. Useful for accessing or modifying global state (like user authentication, theme, etc.) from anywhere in your app.
```
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

- ✅ **Array support** — `getSearchParams` returns `string[]` when multiple values exist for the same key
- ✅ **Functional updates** — Update parameters based on previous state without losing other params
- ✅ **Type-safe** — Proper TypeScript support with overloads
- ✅ **Stable reference** — `setSearchParams` reference is stable and safe to use in `useEffect`

> **Note:** `getSearchParams` returns `string` for single values, `string[]` for multiple values, and `''` if the key is not found.

## Lazy Loading

Clear Router supports code-splitting out of the box. Simply pass a function that returns a dynamic import:
```
{
  path: '/heavy-page',
  element: () => import('./pages/HeavyComponent'),
  fallback: () => <div>Loading...</div>,
}
```
## Animations

Clear Router supports smooth page transitions using the native View Transitions API. When animations are enabled, the router waits for all data to load before starting the transition, ensuring a jank-free experience.

### Quick Start

```
import { Router } from 'clear-react-router';

// Enable fade animation
<RouterProvider routeList={routes} isAnimated>
  <Router />
</RouterProvider>  

// Custom animation duration
<RouterProvider routeList={routes} isAnimated animationDuration={800}>
  <Router />
</RouterProvider>
```

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
