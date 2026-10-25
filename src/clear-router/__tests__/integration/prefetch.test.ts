import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRevalidateCache } from '../../runtime/revalidateCache';
import { createPrefetch } from '../../runtime/prefetch';
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
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		prefetch = createPrefetch(state, revalidateCache);
	});

	it('fetches data for valid route', async () => {
		const loader = vi.fn().mockResolvedValue('prefetched');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		state.routeDataState.setState({
			routeItem: undefined,
			location: { pathname: '/', search: '' },
			status: 'idle',
			loaderState: EMPTY_LOADER_STATE,
		});

		await prefetch({ pathname: '/test' });

		expect(state.loaderMap.has('/test')).toBe(true);
	});

	it('skips when already at same location', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		state.routeDataState.setState({
			routeItem,
			location: { pathname: '/test', search: '' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		await prefetch({ pathname: '/test', search: '' });

		expect(loader).not.toHaveBeenCalled();
	});

	it('fetches when search differs', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		state.routeDataState.setState({
			routeItem,
			location: { pathname: '/test', search: '?a=1' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});

		await prefetch({ pathname: '/test', search: '?b=2' });

		expect(loader).toHaveBeenCalled();
	});

	it('does nothing for unknown route', async () => {
		routerConfig.configure({ routes: [] });

		await prefetch({ pathname: '/nonexistent' });

		expect(state.loaderMap.size).toBe(0);
	});

	it('runs prefetches through the concurrency queue and drains it', async () => {
		const resolvers: Array<() => void> = [];
		const loader = vi.fn(
			() =>
				new Promise<string>(resolve => {
					resolvers.push(() => resolve('data'));
				})
		);
		const routeItems = [0, 1, 2, 3, 4].map(i => createMockRouteItem({ path: `/p${i}`, pattern: `/p${i}`, loader }));
		routerConfig.configure({ routes: routeItems, maxCacheSize: 10 });
		prefetch = createPrefetch(state, revalidateCache);

		const flush = () => new Promise(resolve => setTimeout(resolve, 0)); // all queued microtasks settle
		const all = Promise.all(routeItems.map((_, i) => prefetch({ pathname: `/p${i}` })));
		await flush();

		// desktop width (jsdom matchMedia reports "no coarse pointer") caps at 4 concurrently
		expect(loader).toHaveBeenCalledTimes(4);
		expect(resolvers.length).toBe(4);

		resolvers[0]();
		await flush(); // the freed slot drains the queue

		expect(loader).toHaveBeenCalledTimes(5);
		resolvers.slice(1).forEach(resolve => resolve());
		await all;

		expect(state.loaderMap.size).toBe(5);
	});

	it('calls preloadElement if available', async () => {
		const preloadElement = vi.fn().mockResolvedValue({ default: () => null });
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader, preloadElement });
		routerConfig.configure({ routes: [routeItem] });

		state.routeDataState.setState({
			routeItem: undefined,
			location: { pathname: '/', search: '' },
			status: 'idle',
			loaderState: EMPTY_LOADER_STATE,
		});

		await prefetch({ pathname: '/test' });

		expect(preloadElement).toHaveBeenCalled();
	});
});
