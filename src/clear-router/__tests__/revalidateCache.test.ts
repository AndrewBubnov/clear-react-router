import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRevalidateCache } from '../runtime/revalidateCache';
import { create } from '../create';
import { routerConfig } from '../config/routerConfig';
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
import { createMockRouteItem, EMPTY_LOADER_STATE } from './common.tsx';

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
		revalidateCache = createRevalidateCache(state);
		const routeItem = createMockRouteItem({ loader: undefined });
		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});
		expect(result).toBeUndefined();
	});

	it('calls loader and caches result', async () => {
		const loader = vi.fn().mockResolvedValue('test data');
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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

	it('refetches when cache is stale', async () => {
		const loader = vi.fn().mockResolvedValueOnce('data v1').mockResolvedValueOnce('data v2');
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
		const routeItem = createMockRouteItem({ loader, retry: 2 });

		const result = await revalidateCache({
			routeItem,
			location: { pathname: '/test' },
		});

		expect(result).toEqual({ data: 'retry success', error: null });
		expect(loader).toHaveBeenCalledTimes(2);
	});

	it('retries with delay', async () => {
		const error = new Error('fail');
		const loader = vi.fn().mockRejectedValueOnce(error).mockResolvedValueOnce('retry success');
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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

	it('returns cached error state from cache', async () => {
		const error = new Error('cached error');
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
		revalidateCache = createRevalidateCache(state);
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
