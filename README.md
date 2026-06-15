[![npm version](https://badge.fury.io/js/clear-react-router.svg)](https://www.npmjs.com/package/clear-react-router)

A lightweight, type-safe routing library for React applications with nested routes, data loading, navigation blocking, and prefetching.

## Features

- 🧩 **Nested Routes** - Organize your UI with nested layouts and routes
- ⚡ **Data Loading** - Built-in loaders with caching and stale-while-revalidate strategy
- 🔒 **Navigation Blocking** - Prevent accidental navigation with `useBlocker`
- ✨ **Smooth Animations** - Page transitions with fade and slide effects (customizable type and duration)
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
| `loader` | `() => Promise<unknown>` | Fetch data |
| `beforeLoad` | `({ context, redirect }) => Promise<void>` | Auth checks and redirects. `redirect` is provided by the router |
| `afterLoad` | `(context) => Promise<void>` | Analytics, side effects |
| `fallback` | `ReactElement \| () => ReactElement` | Loading fallback (for lazy loading) |
| `loaderFallback` | `ReactElement \| () => ReactElement` | Loading fallback (for loader) |
| `errorElement` | `ReactElement \| () => ReactElement` | Error fallback |
| `staleTime` | `number` | Cache duration in ms for loader data |
| `children` | `RouteItem[]` | Nested routes |

### `Router`

Main component that renders the application based on current URL.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `routeList` | `RouteItem[]` | required | Array of route configurations |
| `context` | `object` | `{}` | Optional initial context (user, theme, etc.) |
| `isAnimated` | `boolean` | `false` | Enable smooth page transitions |
| `animationOptions` | `AnimationOptions` | `{ duration: 300, name: 'fade' }` | Animation settings (only when `isAnimated` is `true`) |

**`AnimationOptions`:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `duration` | `number` | `300` | Animation duration in milliseconds |
| `name` | `'fade' \| 'slide-left' \| 'slide-right'` | `'fade'` | Type of transition effect |

> **Note:** When `isAnimated` is enabled, the `loaderFallback` is not displayed. Instead, a small spinner appears in the corner while data loads, ensuring smooth transitions without layout shifts.

### `Link`

Component for client-side navigation with prefetch support.

| Prop | Type | Default |
|------|------|---------|
| `to` | `string` | required |
| `prefetch` | `boolean` | `true` |
| `children` | `ReactElement` | required |

### `redirect`

Function provided to `beforeLoad` for programmatic redirection.

**Type:** `(arg: Location) => Promise<void>`

```
import type { Location } from 'clear-react-router';

const routes = createRouter([
  {
    path: '/dashboard',
    element: <Dashboard />,
    beforeLoad: ({ context, redirect }) => {
      if (!context.isAuthorized) {
        return redirect({ pathname: '/' });
      }
    },
  },
]);
```

## Hooks

### `useNavigate()`

Returns function to navigate programmatically:

- `navigate({ pathname: '/about' })` - navigate to path
- `navigate({ pathname: '/user/123', state: { fromDashboard: true } })` - navigate with state
- `navigate(-1)` - go back

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

const params = useParams<{ userId: string }>();
// URL: /user/123 → params.userId === '123'

### `useLocation()`

Returns current location `{ pathname, search, state }`.
```
const { pathname, search, state } = useLocation();
```

### `useLoaderState()`

Returns loaderState from current route's loader.

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

### `useRouterContext()`

Handles router context.
```
const { setContext, context } = useRouterContext();
const loginHandler = () => setContext({ ...context, user: { name: 'John' } });
```

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

// Enable default fade animation
<Router routeList={routes} isAnimated />

// Custom animation
<Router 
  routeList={routes} 
  isAnimated 
  animationOptions={{ 
    duration: 500,        // milliseconds
    name: 'slide-left'    // 'fade' | 'slide-left' | 'slide-right'
  }} 
/>
```

## How It Works

- **Data loads first** — All `loader` and `beforeLoad` hooks complete before animation starts
- **No `loaderFallback`** — The `loaderFallback` is not shown during animated transitions
- **Subtle spinner** — A small spinner appears in the top-left corner while data is loading, so users know the app is responsive
- **Native API** — Uses `document.startViewTransition` for smooth, hardware-accelerated animations

## Animation Types

| Name | Effect |
|------|--------|
| `fade` | Cross-fade between pages (default) |
| `slide-left` | New page slides in from right, old page slides out to left |
| `slide-right` | New page slides in from left, old page slides out to right |

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
