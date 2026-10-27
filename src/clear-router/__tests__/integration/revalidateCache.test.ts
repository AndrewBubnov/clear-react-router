import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRevalidateCache } from '../../runtime/revalidateCache';
import { create } from '../../create';
import { routerConfig } from '../../config/routerConfig';
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
import { createMockRouteItem, EMPTY_LOADER_STATE } from '../common.tsx';

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

describe('revalidateCache', () => {
	let state: RouterState;
	let revalidateCache: ReturnType<typeof createRevalidateCache>;

	beforeEach(() => {
		state = createMockRouterState();
		routerConfig.configure({
			routes: [],
			maxCacheSize: 10,
			defaultRetry: undefined,
			defaultStaleTime: undefined,
		});
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('returns undefined when no loader', async () => {
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader: undefined });
		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});
		expect(result).toBeUndefined();
	});

	it('calls loader and caches result', async () => {
		const loader = vi.fn().mockResolvedValue('test data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'test data', error: null });
		expect(loader).toHaveBeenCalledOnce();
		expect(state.loaderMap.has('/test')).toBe(true);
		expect(state.loaderMap.get('/test')?.state.data).toBe('test data');
	});

	it('returns cached data on second call (fresh cache)', async () => {
		const loader = vi.fn().mockResolvedValue('test data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, staleTime: 10000 });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'test data', error: null });
		expect(loader).toHaveBeenCalledOnce();
	});

	it('refetches when no staleTime is configured', async () => {
		const loader = vi.fn().mockResolvedValueOnce('data v1').mockResolvedValueOnce('data v2');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'data v2', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('keeps prefetched data fresh for the preload window', async () => {
		const loader = vi.fn().mockResolvedValueOnce('prefetched').mockResolvedValueOnce('navigation data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'prefetch',
		});

		vi.advanceTimersByTime(29_000);

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'navigation',
		});

		expect(result).toEqual({ data: 'prefetched', error: null });
		expect(loader).toHaveBeenCalledOnce();
	});

	it('consumes prefetch freshness on the first navigation', async () => {
		const loader = vi.fn().mockResolvedValueOnce('prefetched').mockResolvedValueOnce('navigation data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'prefetch',
		});

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'navigation',
		});

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'navigation',
		});

		expect(result).toEqual({ data: 'navigation data', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('expires prefetched data after the preload window', async () => {
		const loader = vi.fn().mockResolvedValueOnce('prefetched').mockResolvedValueOnce('navigation data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'prefetch',
		});

		vi.advanceTimersByTime(30_001);

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'navigation',
		});

		expect(result).toEqual({ data: 'navigation data', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('does not shorten a longer route staleTime when prefetching', async () => {
		const loader = vi.fn().mockResolvedValue('prefetched');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, staleTime: 60_000 });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'prefetch',
		});

		vi.advanceTimersByTime(40_000);

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			reason: 'navigation',
		});

		expect(result).toEqual({ data: 'prefetched', error: null });
		expect(loader).toHaveBeenCalledOnce();
	});

	it('uses defaultStaleTime when the route does not set staleTime', async () => {
		routerConfig.configure({ defaultStaleTime: 10000 });
		const loader = vi.fn().mockResolvedValue('test data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'test data', error: null });
		expect(loader).toHaveBeenCalledOnce();
	});

	it('treats staleTime: 0 as always stale', async () => {
		const loader = vi.fn().mockResolvedValueOnce('data v1').mockResolvedValueOnce('data v2');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, staleTime: 0 });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'data v2', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('keeps data fresh forever with staleTime: Infinity', async () => {
		const loader = vi.fn().mockResolvedValue('test data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, staleTime: Infinity });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		vi.advanceTimersByTime(1_000_000);

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'test data', error: null });
		expect(loader).toHaveBeenCalledOnce();
	});

	it('refetches when cache is stale', async () => {
		const loader = vi.fn().mockResolvedValueOnce('data v1').mockResolvedValueOnce('data v2');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, staleTime: 100 });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		vi.advanceTimersByTime(200);

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'data v2', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('deduplicates in-flight requests', async () => {
		let resolveLoader!: (value: string) => void;
		const loader = vi.fn(
			() =>
				new Promise<string>(r => {
					resolveLoader = r;
				})
		);
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		const p1 = revalidateCache({ routeItem, location: { pathname: '/test' } });
		const p2 = revalidateCache({ routeItem, location: { pathname: '/test' } });

		resolveLoader('data');
		const [r1, r2] = await Promise.all([p1, p2]);

		expect(r1).toEqual(r2);
		expect(loader).toHaveBeenCalledOnce();
	});

	it('caches loader error', async () => {
		const error = new Error('load failed');
		const loader = vi.fn().mockRejectedValue(error);
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: null, error });
	});

	it('retries on failure', async () => {
		const error = new Error('fail');
		const loader = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('retry success');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, retry: 2 });

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'retry success', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
		expect(loader.mock.calls[0][0]).toMatchObject({ attempt: 1 });
		expect(loader.mock.calls[1][0]).toMatchObject({ attempt: 2 });
	});

	it('retries with delay', async () => {
		const error = new Error('fail');
		const loader = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('retry success');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, retry: { count: 2, delay: 100 } });

		const resultPromise = revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		await vi.advanceTimersByTimeAsync(100);
		const result = await resultPromise;

		expect(result).toEqual({ data: 'retry success', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('gives up after max retries', async () => {
		const error = new Error('persistent fail');
		const loader = vi.fn().mockRejectedValue(error);
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, retry: 1 });

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: null, error });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('evicts oldest entry when cache exceeds maxCacheSize', async () => {
		routerConfig.configure({ maxCacheSize: 2 });
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader, staleTime: 10000 });

		await revalidateCache({ routeItem, location: { pathname: '/a' } });
		await revalidateCache({ routeItem, location: { pathname: '/b' } });
		await revalidateCache({ routeItem, location: { pathname: '/c' } });

		expect(state.loaderMap.size).toBe(2);
		expect(state.loaderMap.has('/a')).toBe(false);
		expect(state.loaderMap.has('/b')).toBe(true);
		expect(state.loaderMap.has('/c')).toBe(true);
	});

	it('does not evict the current route when a prefetch fills the cache', async () => {
		routerConfig.configure({ maxCacheSize: 2 });
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const loader = vi.fn().mockResolvedValue('new data');
		const routeItem = createMockRouteItem({ loader, staleTime: 10000 });

		state.routeDataState.setState({
			routeItem: undefined,
			location: { pathname: '/live', search: '?tab=1' },
			status: 'active',
			loaderState: EMPTY_LOADER_STATE,
		});
		state.loaderMap.set('/live?tab=1', {
			state: { data: 'live data', beforeLoadError: null, loaderError: null },
			timestamp: Date.now(),
			staleTime: 10000,
			reason: 'navigation',
		});
		state.loaderMap.set('/other', {
			state: { data: 'other data', beforeLoadError: null, loaderError: null },
			timestamp: Date.now(),
			staleTime: 10000,
			reason: 'navigation',
		});

		await revalidateCache({ routeItem, location: { pathname: '/new' }, reason: 'prefetch' });

		expect(state.loaderMap.has('/live?tab=1')).toBe(true);
		expect(state.loaderMap.has('/other')).toBe(false);
		expect(state.loaderMap.has('/new')).toBe(true);
	});

	it('returns cached error state from cache', async () => {
		const error = new Error('cached error');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		state.loaderMap.set('/test', {
			state: { data: null, loaderError: error, beforeLoadError: null },
			timestamp: Date.now(),
			staleTime: 10000,
		});

		const routeItem = createMockRouteItem({ loader: vi.fn() });
		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: null, error });
	});

	it('returns undefined when cache fresh but no state', async () => {
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		state.loaderMap.set('/test', {
			state: undefined as unknown as LoaderStateItem['state'],
			timestamp: Date.now(),
			staleTime: 10000,
		});

		const routeItem = createMockRouteItem({ loader: vi.fn() });
		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toBeUndefined();
	});

	it('does not cache when signal is aborted', async () => {
		const loader = vi.fn().mockImplementation(
			(_args: { signal: AbortSignal }) =>
				new Promise((resolve, reject) => {
					const timer = setTimeout(() => resolve('data'), 1000);
					_args.signal.addEventListener('abort', () => {
						clearTimeout(timer);
						reject(new DOMException('Aborted', 'AbortError'));
					});
				})
		);
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		const controller = new AbortController();
		const promise = revalidateCache({ routeItem, location: { pathname: '/test' }, signal: controller.signal });

		controller.abort();
		vi.advanceTimersByTime(100);

		const result = await promise;
		expect(result).toEqual({ data: null, error: null });
		expect(state.loaderMap.has('/test')).toBe(false);
	});

	it('uses default retry from routerConfig', async () => {
		routerConfig.configure({ defaultRetry: { count: 1, delay: 0 } });
		const error = new Error('fail');
		const loader = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('success');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'success', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('route retry overrides global retry', async () => {
		routerConfig.configure({ defaultRetry: { count: 5, delay: 0 } });
		const loader = vi.fn().mockRejectedValue(new Error('fail'));
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader, retry: 1 });

		await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('navigation cancels in-flight prefetch for the same path', async () => {
		const loader = vi
			.fn()
			.mockImplementationOnce(
				(args: { signal: AbortSignal }) =>
					new Promise<string>((_resolve, reject) => {
						args.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
					})
			)
			.mockResolvedValueOnce('navigation data');
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		// Prefetch without a navigation signal hangs in flight
		const prefetchPromise = revalidateCache({ routeItem, location: { pathname: '/test' } });
		const controller = new AbortController();
		const navPromise = revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			signal: controller.signal,
		});

		const [prefetchResult, navResult] = await Promise.all([prefetchPromise, navPromise]);

		expect(prefetchResult).toEqual({ data: null, error: null });
		expect(navResult).toEqual({ data: 'navigation data', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('deduplicates concurrent navigations with different signals', async () => {
		let resolveLoader!: (value: string) => void;
		const loader = vi.fn(
			() =>
				new Promise<string>(r => {
					resolveLoader = r;
				})
		);
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		const p1 = revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			signal: new AbortController().signal,
		});
		const p2 = revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			signal: new AbortController().signal,
		});

		resolveLoader('data');
		const [r1, r2] = await Promise.all([p1, p2]);

		expect(r1).toEqual({ data: 'data', error: null });
		expect(r1).toEqual(r2);
		expect(loader).toHaveBeenCalledOnce();
	});

	it('aborted prefetch cleanup does not remove the navigation entry', async () => {
		let resolveNav!: (value: string) => void;
		const loader = vi
			.fn()
			.mockImplementationOnce(
				(args: { signal: AbortSignal }) =>
					new Promise<string>((_resolve, reject) => {
						args.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
					})
			)
			.mockImplementationOnce(
				() =>
					new Promise<string>(r => {
						resolveNav = r;
					})
			);
		revalidateCache = createRevalidateCache(state, syncCacheSnapshot);
		const routeItem = createMockRouteItem({ loader });

		const prefetchPromise = revalidateCache({ routeItem, location: { pathname: '/test' } });
		const navPromise = revalidateCache({
			routeItem,
			location: { pathname: '/test' },
			signal: new AbortController().signal,
		});

		// Let the aborted prefetch settle (including its finally block)
		await prefetchPromise;
		expect(state.loadingPromises.has('/test')).toBe(true);

		resolveNav('nav data');
		const navResult = await navPromise;

		expect(navResult).toEqual({ data: 'nav data', error: null });
		expect(state.loadingPromises.has('/test')).toBe(false);
	});
});
