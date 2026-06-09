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
- `navigate(-1)` - go back

### `useParams<T>()`

Returns route parameters object.

const params = useParams<{ userId: string }>();
// URL: /user/123 → params.userId === '123'

### `useLocation()`

Returns current location `{ pathname, search }`.

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

**Example:**

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

### `useBeforeUnload(callback?)`

Executes a callback when the page is about to be closed or reloaded. Perfect for auto-saving data at the last moment.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `callback` | `() => void | undefined` | Function to execute before page unload (e.g., auto-save) |

**Note:** This hook does not show a browser confirmation dialog. It silently executes the callback, allowing you to save user data in the background before the page closes.

**Example:**

const [text, setText] = useState('');
const onSave = useCallback(() => {
  localStorage.setItem('draft', text);
}, [text]);

// Auto-save when user tries to close/reload the page
useBeforeUnload(text ? onSave : undefined);
