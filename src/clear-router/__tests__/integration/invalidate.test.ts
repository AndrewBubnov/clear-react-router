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
} from '../../types';

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
		revalidateCache = createRevalidateCache(state);
		invalidate = createInvalidate(state, revalidateCache);
	});

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
		expect(result.every(entry => !entry.path.includes(':'))).toBe(true);
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
