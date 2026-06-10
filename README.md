[![npm version](https://badge.fury.io/js/clear-react-router.svg)](https://www.npmjs.com/package/clear-react-router)

A lightweight, type-safe routing library for React applications with nested routes, data loading, navigation blocking, and prefetching.

## Features

- 🧩 **Nested Routes** - Organize your UI with nested layouts and routes
- ⚡ **Data Loading** - Built-in loaders with caching and stale-while-revalidate strategy
- 🔒 **Navigation Blocking** - Prevent accidental navigation with `useBlocker`
- 🎯 **Type-safe Redirects** - Redirect from loaders and beforeLoad hooks
- 📦 **Prefetching** - Preload data on hover for instant navigation
- 🚀 **Lazy Loading** - Code-split your routes with dynamic imports for optimal performance
- 🎨 **Flexible API** - Use components or hooks as you prefer
- 📱 **Browser History** - Full support for browser back/forward buttons
- 🧠 **Context-aware** - Pass and update context through routes

## API

### `Router`

Main component that renders the application based on current URL.

| Prop | Type | Description |
|------|------|-------------|
| `routeList` | `RouteItem[]` | Array of route configurations |
| `context` | `object` | Optional initial context (user, theme, etc.) |

### `createRouter(routes)`

Normalizes route configuration. Handles wildcard `*` routes, extracts dynamic params, builds nested paths.

### `redirect(url, search?)`

Redirects from `beforeLoad`.
```
beforeLoad: context => {
					if (!context.isAuthorized) return redirect('/');
				}
```

### `Link`

Component for client-side navigation with prefetch support.

| Prop | Type | Default |
|------|------|---------|
| `to` | `string` | required |
| `prefetch` | `boolean` | `true` |
| `children` | `ReactElement` | required |

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
| `callback` | `() => void | undefined` | Function to execute before page unload (e.g., auto-save) |

**Note:** This hook does not show a browser confirmation dialog. It silently executes the callback, allowing you to save user data in the background before the page closes.

```
const [text, setText] = useState('');
const onSave = useCallback(() => {
  localStorage.setItem('draft', text);
}, [text]);

// Auto-save when user tries to close/reload the page
useBeforeUnload(text ? onSave : undefined);
```
## Route Configuration

### `RouteItem`

| Property | Type | Description |
|----------|------|-------------|
| `path` | `string` | Route path, e.g., `/user/:userId` |
| `element` | `ReactElement \| () => ReactElement \| LazyComponent` | Component to render |
| `loader` | `() => Promise<unknown>` | Fetch data |
| `beforeLoad` | `(context) => Promise<void>` | Auth checks, redirects |
| `afterLoad` | `(context) => Promise<void>` | Analytics, side effects |
| `fallback` | `ReactElement \| () => ReactElement` | Loading fallback (for lazy loading) |
| `loaderFallback` | `ReactElement \| () => ReactElement` | Loading fallback (for loader) |
| `errorElement` | `ReactElement \| () => ReactElement` | Error fallback |
| `staleTime` | `number` | Cache duration in ms for loader data |
| `children` | `RouteItem[]` | Nested routes |

## Lazy Loading

Clear Router supports code-splitting out of the box. Simply pass a function that returns a dynamic import:
```
{
  path: '/heavy-page',
  element: () => import('./pages/HeavyComponent'),
  fallback: () => <div>Loading...</div>,
}
```

## Requirements
- React 16.6+ (for React.lazy and Suspense)
- Use `default` export for your lazy-loaded components

 ## License
 MIT
