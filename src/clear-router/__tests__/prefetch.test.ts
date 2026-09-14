import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRevalidateCache } from '../runtime/revalidateCache';
import { createPrefetch } from '../runtime/prefetch';
import { create } from '../create';
import { routerConfig } from '../config/routerConfig';
import { createMockRouteItem, EMPTY_LOADER_STATE } from './common';
import {
	LoaderState,
	LoaderStateItem,
	LoadingPromise,
	Location,
	RouteItemData,
	RouterState,
	ScrollMap,
	BlockerState,
} from '../types';

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

describe('prefetch', () => {
	let state: RouterState;
	let revalidateCache: ReturnType<typeof createRevalidateCache>;
	let prefetch: ReturnType<typeof createPrefetch>;

	beforeEach(() => {
		state = createMockRouterState();
		const loader = vi.fn().mockResolvedValue('prefetched');
		routerConfig.configure({
			routes: [createMockRouteItem({ path: '/test', pattern: '/test', loader })],
			maxCacheSize: 10,
		});
		revalidateCache = createRevalidateCache(state);
		prefetch = createPrefetch(state, revalidateCache);
	});

	it('fetches data for valid route', async () => {
		const loader = vi.fn().mockResolvedValue('prefetched');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		state.routeItemDataState.setState({
			routeItem: undefined,
			location: { pathname: '/', search: '' },
			status: 'idle',
		});

		await prefetch({ pathname: '/test' });

		expect(state.loaderMap.has('/test')).toBe(true);
	});

	it('skips when already at same location', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		state.routeItemDataState.setState({
			routeItem,
			location: { pathname: '/test', search: '' },
			status: 'active',
		});

		await prefetch({ pathname: '/test', search: '' });

		expect(loader).not.toHaveBeenCalled();
	});

	it('fetches when search differs', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		state.routeItemDataState.setState({
			routeItem,
			location: { pathname: '/test', search: '?a=1' },
			status: 'active',
		});

		await prefetch({ pathname: '/test', search: '?b=2' });

		expect(loader).toHaveBeenCalled();
	});

	it('does nothing for unknown route', async () => {
		routerConfig.configure({ routes: [] });

		await prefetch({ pathname: '/nonexistent' });

		expect(state.loaderMap.size).toBe(0);
	});

	it('calls preloadElement if available', async () => {
		const preloadElement = vi.fn().mockResolvedValue({ default: () => null });
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader, preloadElement });
		routerConfig.configure({ routes: [routeItem] });

		state.routeItemDataState.setState({
			routeItem: undefined,
			location: { pathname: '/', search: '' },
			status: 'idle',
		});

		await prefetch({ pathname: '/test' });

		expect(preloadElement).toHaveBeenCalled();
	});
});
