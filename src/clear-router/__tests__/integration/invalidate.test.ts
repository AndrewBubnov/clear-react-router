import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRevalidateCache } from '../../runtime/revalidateCache';
import { createInvalidate } from '../../runtime/invalidate';
import { create } from '../../create';
import { routerConfig } from '../../config/routerConfig';
import { createMockRouteItem, EMPTY_LOADER_STATE } from '../common';
import {
	LoaderStateItem,
	LoadingPromise,
	Location,
	RouteData,
	RouterState,
	ScrollMap,
	BlockerState,
	ClientRouteItem,
	CacheSnapshot,
} from '../../types';

const syncCacheSnapshot = () => {};

const createMockRouterState = (): RouterState => ({
	routeDataState: create<RouteData>({
		routeItem: undefined,
		location: { pathname: '/', search: '' },
		status: 'idle',
		loaderState: EMPTY_LOADER_STATE,
	}),
	scrollMapState: create<ScrollMap>({}),
	contextState: create<Record<string, unknown>>({}),
	blockerState: create<BlockerState>('unblocked'),
	blockedTargetState: create<Location | null>(null),
	cacheSnapshotState: create<CacheSnapshot>([]),
	loaderMap: new Map<string, LoaderStateItem>(),
	loadingPromises: new Map<string, LoadingPromise>(),
});

describe('invalidate', () => {
	let state: RouterState;
	let revalidateCache: ReturnType<typeof createRevalidateCache>;
	let invalidate: ReturnType<typeof createInvalidate>;
	let loader: ClientRouteItem['loader'];

	beforeEach(() => {
		state = createMockRouterState();
		loader = vi.fn().mockResolvedValue('fresh data');
		routerConfig.configure({
			routes: [
				createMockRouteItem({ path: '/users', pattern: '/users', loader }),
				createMockRouteItem({ path: '/users/:id', pattern: '/users/:id', loader }),
				createMockRouteItem({ path: '/posts', pattern: '/posts', loader }),
			],
			maxCacheSize: 10,
		});
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		invalidate = createInvalidate(state, revalidateCache, syncCacheSnapshot);
	});

	const seedCache = (pathname: string, data = `old ${pathname}`) => {
		state.loaderMap.set(pathname, {
			state: { data, loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
	};

	const createDynamicLoader = () =>
		vi.fn(
			async ({
				params,
				location,
				searchParams,
			}: {
				params: Record<string, string>;
				location: Location;
				searchParams: Record<string, string>;
			}) => `user:${params.id}@${location.pathname}${searchParams.tab ? `?tab=${searchParams.tab}` : ''}`
		);

	const configureDynamicRoute = (loader: ClientRouteItem['loader']) => {
		routerConfig.configure({
			routes: [createMockRouteItem({ path: '/users/:id', pattern: '/users/:id', loader })],
			maxCacheSize: 10,
		});
	};

	it('invalidates cached path and re-fetches', async () => {
		state.loaderMap.set('/users', {
			state: { data: 'old data', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users');

		expect(result).toHaveLength(1);
		expect(result[0].data).toBe('fresh data');
		expect(state.loaderMap.get('/users')?.state.data).toBe('fresh data');
	});

	it('does not delete cache when staleOnly', async () => {
		state.loaderMap.set('/users', {
			state: { data: 'old data', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		await invalidate('/users', { staleOnly: true });

		expect(state.loaderMap.has('/users')).toBe(true);
	});

	it('waits for an in-flight load and refetches instead of returning it', async () => {
		let resolvePrefetch!: (value: string) => void;
		const flightLoader = vi
			.fn()
			.mockImplementationOnce(
				() =>
					new Promise<string>(resolve => {
						resolvePrefetch = resolve;
					})
			)
			.mockResolvedValueOnce('fresh data');
		const routeItem = createMockRouteItem({ path: '/users', pattern: '/users', loader: flightLoader });
		routerConfig.configure({ routes: [routeItem], maxCacheSize: 10 });
		state.routeDataState.setState({
			routeItem,
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const prefetchPromise = revalidateCache({
			routeItem,
			location: { pathname: '/users' },
			reason: 'prefetch',
		});
		const invalidatePromise = invalidate('/users');
		resolvePrefetch('stale prefetch');
		await prefetchPromise;

		const result = await invalidatePromise;

		expect(result[0].data).toBe('fresh data');
		expect(state.loaderMap.get('/users')?.state.data).toBe('fresh data');
		expect(flightLoader).toHaveBeenCalledTimes(2);
	});

	it('force adds path even if not in cache', async () => {
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users', { force: true });

		expect(result).toHaveLength(1);
		expect(result[0].data).toBe('fresh data');
	});

	it('returns empty array for unknown path', async () => {
		state.routeDataState.setState({
			routeItem: undefined,
			location: { pathname: '/', search: '' },
			status: 'idle',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/nonexistent');
		expect(result).toEqual([]);
	});

	it('invalidates multiple paths', async () => {
		state.loaderMap.set('/users', {
			state: { data: 'old', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.loaderMap.set('/posts', {
			state: { data: 'old', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate(['/users', '/posts']);

		expect(result).toHaveLength(2);
	});

	it('invalidates current route when no pathList', async () => {
		state.loaderMap.set('/users', {
			state: { data: 'old', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate();

		expect(result).toHaveLength(1);
	});

	it('updates loaderState when invalidating current route', async () => {
		state.loaderMap.set('/users', {
			state: { data: 'old', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		await invalidate('/users');

		expect(state.routeDataState.getState().loaderState.data).toBe('fresh data');
	});

	it('handles path with search params', async () => {
		state.loaderMap.set('/users?page=1', {
			state: { data: 'old', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '?page=1' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users?page=1');

		expect(result).toHaveLength(1);
		expect(result[0].path).toBe('/users?page=1');
	});

	it('fetches uncached path by default (implicit force)', async () => {
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users');

		expect(result).toHaveLength(1);
		expect(result[0].data).toBe('fresh data');
		expect(loader).toHaveBeenCalledTimes(1);
	});

	it('does not fetch uncached path with explicit force: false', async () => {
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users', { force: false });

		expect(result).toEqual([]);
		expect(loader).not.toHaveBeenCalled();
	});

	it('does not fetch uncached path with staleOnly', async () => {
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users', { staleOnly: true });

		expect(result).toEqual([]);
		expect(loader).not.toHaveBeenCalled();
	});

	it('recovers error page without cache and sets status to active', async () => {
		const loadError = new Error('first load failed');
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'error',
			loaderState: EMPTY_LOADER_STATE,
		});
		state.routeDataState.setState(prevState => ({
			...prevState,
			loaderState: { data: null, loaderError: loadError, beforeLoadError: null },
		}));

		const result = await invalidate();

		expect(result).toHaveLength(1);
		expect(result[0].data).toBe('fresh data');
		expect(state.routeDataState.getState().status).toBe('active');
		expect(state.routeDataState.getState().loaderState).toEqual({ data: 'fresh data', loaderError: null, beforeLoadError: null });
	});

	it('sets status to error when revalidation of the working page fails', async () => {
		const loadError = new Error('refetch failed');
		const failingLoader = vi.fn().mockRejectedValueOnce(loadError).mockResolvedValue('fresh data');
		routerConfig.configure({
			routes: [createMockRouteItem({ path: '/users', pattern: '/users', loader: failingLoader })],
			maxCacheSize: 10,
		});
		state.loaderMap.set('/users', {
			state: { data: 'old data', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader: failingLoader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users');

		expect(result).toHaveLength(1);
		expect(result[0].error).toBe(loadError);
		expect(state.routeDataState.getState().status).toBe('error');
		expect(state.routeDataState.getState().loaderState.loaderError).toBe(loadError);
	});

	it('does not touch current status when revalidating another route', async () => {
		state.loaderMap.set('/posts', {
			state: { data: 'old', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});
		state.routeDataState.setState(prevState => ({
			...prevState,
			loaderState: { data: 'users data', loaderError: null, beforeLoadError: null },
		}));

		const result = await invalidate('/posts');

		expect(result).toHaveLength(1);
		expect(state.routeDataState.getState().status).toBe('active');
		expect(state.routeDataState.getState().loaderState.data).toBe('users data');
	});

	it('invalidates only the exact cached dynamic path', async () => {
		const dynamicLoader = createDynamicLoader();
		configureDynamicRoute(dynamicLoader);
		seedCache('/users/1');
		seedCache('/users/2');
		seedCache('/users/3');
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader: dynamicLoader }),
			location: { pathname: '/users/1', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		const result = await invalidate('/users/1');

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ path: '/users/1', data: 'user:1@/users/1' });
		expect(dynamicLoader).toHaveBeenCalledTimes(1);
		expect(dynamicLoader.mock.calls[0]?.[0]).toMatchObject({
			params: { id: '1' },
			location: { pathname: '/users/1' },
		});
		expect(state.loaderMap.get('/users/2')?.state.data).toBe('old /users/2');
		expect(state.loaderMap.get('/users/3')?.state.data).toBe('old /users/3');
	});

	it('treats a trailing slash as the same pathname but still not a sibling', async () => {
		const dynamicLoader = createDynamicLoader();
		configureDynamicRoute(dynamicLoader);
		seedCache('/users/1/');
		seedCache('/users/2');

		const result = await invalidate('/users/1');

		expect(result.map(entry => entry.path).sort()).toEqual(['/users/1', '/users/1/']);
		expect(dynamicLoader).toHaveBeenCalledTimes(2);
		const requestedPaths = dynamicLoader.mock.calls.map(([args]) => args.location.pathname).sort();
		expect(requestedPaths).toEqual(['/users/1', '/users/1/']);
		expect(state.loaderMap.get('/users/2')?.state.data).toBe('old /users/2');
	});

	it('force revalidates an uncached dynamic path without touching its siblings', async () => {
		const dynamicLoader = createDynamicLoader();
		configureDynamicRoute(dynamicLoader);
		seedCache('/users/2');

		const result = await invalidate('/users/4', { force: true });

		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({ path: '/users/4', data: 'user:4@/users/4' });
		expect(dynamicLoader).toHaveBeenCalledTimes(1);
		expect(dynamicLoader.mock.calls[0]?.[0]).toMatchObject({ params: { id: '4' } });
		expect(state.loaderMap.get('/users/2')?.state.data).toBe('old /users/2');
	});

	it('invalidates all search variants of one dynamic path only', async () => {
		const dynamicLoader = createDynamicLoader();
		configureDynamicRoute(dynamicLoader);
		seedCache('/users/1?tab=a');
		seedCache('/users/1?tab=b');
		seedCache('/users/2');

		const result = await invalidate('/users/1?tab=a');

		expect(result.map(entry => entry.path).sort()).toEqual(['/users/1?tab=a', '/users/1?tab=b']);
		expect(dynamicLoader).toHaveBeenCalledTimes(2);
		const calls = dynamicLoader.mock.calls.map(([args]) => args);
		expect(calls.map(args => args.params.id)).toEqual(['1', '1']);
		expect(calls.map(args => args.location.pathname)).toEqual(['/users/1', '/users/1']);
		expect(calls.map(args => args.searchParams.tab).sort()).toEqual(['a', 'b']);
		expect(state.loaderMap.get('/users/2')?.state.data).toBe('old /users/2');
	});

	it('invalidates a pattern target through cached paths without fetching the pattern', async () => {
		const dynamicLoader = createDynamicLoader();
		configureDynamicRoute(dynamicLoader);
		seedCache('/users/1');
		seedCache('/users/2');

		const result = await invalidate('/users/:id');

		expect(result.map(entry => entry.path).sort()).toEqual(['/users/1', '/users/2']);
		expect(dynamicLoader).toHaveBeenCalledTimes(2);
		const requestedPaths = dynamicLoader.mock.calls.map(([args]) => args.location.pathname).sort();
		expect(requestedPaths).toEqual(['/users/1', '/users/2']);
		expect(requestedPaths.some(path => path.includes(':') || path.includes('['))).toBe(false);
	});

	it('matches bracket patterns against cached concrete paths only', async () => {
		const dynamicLoader = createDynamicLoader();
		configureDynamicRoute(dynamicLoader);
		seedCache('/users/1');
		seedCache('/users/2');

		const result = await invalidate('/users/[id]', { force: true });

		expect(result.map(entry => entry.path).sort()).toEqual(['/users/1', '/users/2']);
		expect(dynamicLoader).toHaveBeenCalledTimes(2);
		const requestedPaths = dynamicLoader.mock.calls.map(([args]) => args.location.pathname);
		expect(requestedPaths).not.toContain('/users/[id]');
		expect(requestedPaths).not.toContain('/users/:id');
	});

	it('does not fetch an uncached pattern, even with force', async () => {
		const dynamicLoader = createDynamicLoader();
		configureDynamicRoute(dynamicLoader);

		for (const pattern of ['/users/:id', '/users/[id]']) {
			const result = await invalidate(pattern, { force: true });
			expect(result).toEqual([]);
		}

		expect(dynamicLoader).not.toHaveBeenCalled();
	});

	it('withChildren revalidates nested entries without fetching literal param paths', async () => {
		const nestLoader = vi.fn(async ({ params }: { params: Record<string, string> }) => `nest:${params.nestId}`);
		const itemLoader = vi.fn(
			async ({ params }: { params: Record<string, string> }) => `item:${params.nestId}/${params.itemId}`
		);
		const itemRoute = createMockRouteItem({
			path: '/nest/:nestId/item/:itemId',
			pattern: '/nest/:nestId/item/:itemId',
			loader: itemLoader,
		});
		const nestRoute = createMockRouteItem({
			path: '/nest/:nestId',
			pattern: '/nest/:nestId',
			loader: nestLoader,
			children: [{ path: '/item/:itemId' }] as never,
		});
		const parentRoute = createMockRouteItem({
			path: '/nest',
			pattern: '/nest',
			children: [{ path: '/:nestId', children: [{ path: '/item/:itemId' }] }] as never,
		});
		routerConfig.configure({ routes: [parentRoute, nestRoute, itemRoute], maxCacheSize: 10 });
		for (const key of ['/nest/abc', '/nest/abc/item/def']) {
			state.loaderMap.set(key, {
				state: { data: 'old data', loaderError: null, beforeLoadError: null },
				timestamp: Date.now(),
				staleTime: 10000,
			});
		}

		const result = await invalidate('/nest', { withChildren: true });

		expect(nestLoader).toHaveBeenCalledTimes(1);
		expect(itemLoader).toHaveBeenCalledTimes(1);
		expect(nestLoader.mock.calls[0]?.[0]).toMatchObject({ params: { nestId: 'abc' } });
		expect(itemLoader.mock.calls[0]?.[0]).toMatchObject({ params: { nestId: 'abc', itemId: 'def' } });
		expect(result.every(entry => !entry.path.includes(':') && !entry.path.includes('['))).toBe(true);
		expect(result.map(entry => entry.path).sort()).toEqual(['/nest', '/nest/abc', '/nest/abc/item/def']);
	});

	it('withChildren still recurses when the parent route has no loader', async () => {
		const childLoader = vi.fn(async ({ params }: { params: Record<string, string> }) => `child:${params.nestId}`);
		const nestRoute = createMockRouteItem({
			path: '/nest/:nestId',
			pattern: '/nest/:nestId',
			loader: childLoader,
		});
		const parentRoute = createMockRouteItem({
			path: '/nest',
			pattern: '/nest',
			children: [{ path: '/:nestId' }] as never,
		});
		routerConfig.configure({ routes: [parentRoute, nestRoute], maxCacheSize: 10 });
		state.loaderMap.set('/nest/abc', {
			state: { data: 'old data', loaderError: null, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});

		const result = await invalidate('/nest', { withChildren: true });

		expect(childLoader).toHaveBeenCalledTimes(1);
		expect(childLoader.mock.calls[0]?.[0]).toMatchObject({ params: { nestId: 'abc' } });
		expect(result.map(entry => entry.path).sort()).toEqual(['/nest', '/nest/abc']);
	});
});
