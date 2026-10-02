import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRevalidateCache } from '../../runtime/revalidateCache';
import { createInvalidate } from '../../runtime/invalidate';
import { create } from '../../create';
import { routerConfig } from '../../config/routerConfig';
import { createMockRouteItem, EMPTY_LOADER_STATE } from '../common';
import {
	LoaderState,
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
	}),
	scrollMapState: create<ScrollMap>({}),
	contextState: create<Record<string, unknown>>({}),
	blockerState: create<BlockerState>('unblocked'),
	loaderState: create<LoaderState>(EMPTY_LOADER_STATE),
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
		});

		await invalidate('/users', { staleOnly: true });

		expect(state.loaderMap.has('/users')).toBe(true);
	});

	it('force adds path even if not in cache', async () => {
		state.routeDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
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
		});

		await invalidate('/users');

		expect(state.loaderState.getState().data).toBe('fresh data');
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
		});
		state.loaderState.setState({ data: null, loaderError: loadError, beforeLoadError: null });

		const result = await invalidate();

		expect(result).toHaveLength(1);
		expect(result[0].data).toBe('fresh data');
		expect(state.routeDataState.getState().status).toBe('active');
		expect(state.loaderState.getState()).toEqual({ data: 'fresh data', loaderError: null, beforeLoadError: null });
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
		});

		const result = await invalidate('/users');

		expect(result).toHaveLength(1);
		expect(result[0].error).toBe(loadError);
		expect(state.routeDataState.getState().status).toBe('error');
		expect(state.loaderState.getState().loaderError).toBe(loadError);
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
		});
		state.loaderState.setState({ data: 'users data', loaderError: null, beforeLoadError: null });

		const result = await invalidate('/posts');

		expect(result).toHaveLength(1);
		expect(state.routeDataState.getState().status).toBe('active');
		expect(state.loaderState.getState().data).toBe('users data');
	});
});
