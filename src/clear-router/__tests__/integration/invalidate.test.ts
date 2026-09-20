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
	RouteItemData,
	RouterState,
	ScrollMap,
	BlockerState,
	ClientRouteItem,
} from '../../types';

const createMockRouterState = (): RouterState => ({
	routeItemDataState: create<RouteItemData>({
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
		state.routeItemDataState.setState({
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
		state.routeItemDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
		});

		await invalidate('/users', { staleOnly: true });

		expect(state.loaderMap.has('/users')).toBe(true);
	});

	it('force adds path even if not in cache', async () => {
		state.routeItemDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '' },
			status: 'active',
		});

		const result = await invalidate('/users', { force: true });

		expect(result).toHaveLength(1);
		expect(result[0].data).toBe('fresh data');
	});

	it('returns empty array for unknown path', async () => {
		state.routeItemDataState.setState({
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
		state.routeItemDataState.setState({
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
		state.routeItemDataState.setState({
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
		state.routeItemDataState.setState({
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
		state.routeItemDataState.setState({
			routeItem: createMockRouteItem({ loader }),
			location: { pathname: '/users', search: '?page=1' },
			status: 'active',
		});

		const result = await invalidate('/users?page=1');

		expect(result).toHaveLength(1);
		expect(result[0].path).toBe('/users?page=1');
	});
});
