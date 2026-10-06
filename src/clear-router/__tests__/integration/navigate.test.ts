import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSyncExternalStore } from 'react';
import { act, renderHook } from '@testing-library/react';
import { createRevalidateCache } from '../../runtime/revalidateCache';
import { createNavigate } from '../../runtime/navigate';
import { createRouterInstance } from '../../creators/createRouterInstance';
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

describe('navigate', () => {
	let state: RouterState;
	let revalidateCache: ReturnType<typeof createRevalidateCache>;
	let navigate: ReturnType<typeof createNavigate>;

	const mockStartViewTransition = (cb: () => void) => {
		cb();
		return { ready: Promise.resolve(), finished: Promise.resolve() } as unknown as ViewTransition;
	};

	beforeEach(() => {
		state = createMockRouterState();
		routerConfig.configure({
			routes: [],
			maxCacheSize: 10,
			isAnimated: false,
		});
		vi.useFakeTimers();
		vi.spyOn(history, 'pushState').mockImplementation(() => {});
		vi.stubGlobal('document', {
			...document,
			startViewTransition: mockStartViewTransition,
		});
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('navigates to route and commits state', async () => {
		const loader = vi.fn().mockResolvedValue('route data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(state.routeDataState.getState().location.pathname).toBe('/test');
		expect(state.routeDataState.getState().loaderState.data).toBe('route data');
		expect(state.routeDataState.getState().status).toBe('active');
	});

	it('sets pending status while loader is running', async () => {
		let resolveLoader!: (value: string) => void;
		const loader = vi.fn(
			() =>
				new Promise<string>(r => {
					resolveLoader = r;
				})
		);
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		const navPromise = navigate({ pathname: '/test' });

		await vi.advanceTimersByTimeAsync(0);
		expect(state.routeDataState.getState().status).toBe('pending');

		resolveLoader('data');
		await navPromise;
		expect(state.routeDataState.getState().status).toBe('active');
	});

	it('skips navigation when blocked', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		state.blockerState.setState('charged');
		await navigate({ pathname: '/test' });

		expect(state.blockerState.getState()).toBe('blocked');
		expect(state.routeDataState.getState().status).toBe('idle');
	});

	it('runs beforeLoad', async () => {
		const beforeLoad = vi.fn();
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader, beforeLoad });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(beforeLoad).toHaveBeenCalled();
	});

	it('handles beforeLoad error', async () => {
		const beforeLoadError = new Error('auth failed');
		const beforeLoad = vi.fn().mockRejectedValue(beforeLoadError);
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader, beforeLoad });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(state.routeDataState.getState().loaderState.beforeLoadError).toBe(beforeLoadError);
		expect(state.routeDataState.getState().status).toBe('error');
		expect(state.routeDataState.getState().routeItem).toBe(routeItem);
		expect(state.routeDataState.getState().location.pathname).toBe('/test');
	});

	it('shows error state of the target route when leaving an active page', async () => {
		const beforeLoadError = new Error('auth failed');
		const routeA = createMockRouteItem({ path: '/a', pattern: '/a' });
		const routeB = createMockRouteItem({
			path: '/b',
			pattern: '/b',
			beforeLoad: vi.fn().mockRejectedValue(beforeLoadError),
		});
		routerConfig.configure({ routes: [routeA, routeB] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/a' });
		expect(state.routeDataState.getState().status).toBe('active');

		await navigate({ pathname: '/b' });

		const routeData = state.routeDataState.getState();
		expect(routeData.status).toBe('error');
		expect(routeData.routeItem).toBe(routeB);
		expect(routeData.location.pathname).toBe('/b');
		expect(state.routeDataState.getState().loaderState.beforeLoadError).toBe(beforeLoadError);
		expect(history.pushState).toHaveBeenCalledWith(null, '', '/b');
	});

	it('runs defaultBeforeLoad', async () => {
		const defaultBeforeLoad = vi.fn();
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem], defaultBeforeLoad });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(defaultBeforeLoad).toHaveBeenCalled();
	});

	it('handles loader error', async () => {
		const loaderError = new Error('server error');
		const loader = vi.fn().mockRejectedValue(loaderError);
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(state.routeDataState.getState().loaderState.loaderError).toBe(loaderError);
		expect(state.routeDataState.getState().status).toBe('error');
	});

	it('skips stale loader when cache is fresh', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader, staleTime: 10000 });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });
		const firstCallCount = loader.mock.calls.length;

		await navigate({ pathname: '/test' });

		expect(loader).toHaveBeenCalledTimes(firstCallCount);
	});

	it('aborts previous navigation', async () => {
		let resolveFirst!: (value: string) => void;
		const loader = vi
			.fn()
			.mockImplementationOnce(
				() =>
					new Promise<string>(r => {
						resolveFirst = r;
					})
			)
			.mockResolvedValueOnce('second');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		const p1 = navigate({ pathname: '/test' });
		await vi.advanceTimersByTimeAsync(0);

		const p2 = navigate({ pathname: '/other' });
		resolveFirst('stale');
		await p1;
		await p2;

		expect(state.routeDataState.getState().location.pathname).toBe('/other');
	});

	it('navigates with search params', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test', search: '?foo=bar' });

		expect(state.routeDataState.getState().location.search).toBe('?foo=bar');
		expect(state.loaderMap.has('/test?foo=bar')).toBe(true);
	});

	it('calls afterLoad asynchronously', async () => {
		const afterLoad = vi.fn();
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader, afterLoad });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(afterLoad).toHaveBeenCalled();
	});

	it('defaultAfterLoad is called', async () => {
		const defaultAfterLoad = vi.fn();
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem], defaultAfterLoad });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(defaultAfterLoad).toHaveBeenCalled();
	});

	it('redirect in beforeLoad triggers new navigation', async () => {
		const targetLoader = vi.fn().mockResolvedValue('redirect target data');
		const targetRoute = createMockRouteItem({
			path: '/target',
			pattern: '/target',
			loader: targetLoader,
		});
		const sourceRoute = createMockRouteItem({
			path: '/source',
			pattern: '/source',
			loader: vi.fn().mockResolvedValue('source data'),
			beforeLoad: async ({ redirect }: { redirect: (loc: Location | string) => Promise<void> }) => {
				await redirect('/target');
			},
		});
		routerConfig.configure({ routes: [targetRoute, sourceRoute] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/source' });

		expect(state.routeDataState.getState().location.pathname).toBe('/target');
	});

	it('sets GC timeout on previous route when navigating away', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const gcRoute = createMockRouteItem({ path: '/gc', pattern: '/gc', loader, gcTime: 5000 });
		const otherRoute = createMockRouteItem({ path: '/other', pattern: '/other', loader });
		routerConfig.configure({ routes: [gcRoute, otherRoute] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/gc' });
		expect(state.loaderMap.has('/gc')).toBe(true);

		await navigate({ pathname: '/other' });

		expect(state.loaderMap.has('/gc')).toBe(true);
		vi.advanceTimersByTime(5000);
		expect(state.loaderMap.has('/gc')).toBe(false);
	});

	it('route without loader just commits state', async () => {
		const routeItem = createMockRouteItem({ loader: undefined });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });

		expect(state.routeDataState.getState().location.pathname).toBe('/test');
		expect(state.routeDataState.getState().status).toBe('active');
	});

	it('minLoaderDuration delays response', async () => {
		const loader = vi.fn().mockResolvedValue('fast data');
		const routeItem = createMockRouteItem({ loader, minLoaderDuration: 500 });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		const navPromise = navigate({ pathname: '/test' });

		await vi.advanceTimersByTimeAsync(500);
		await navPromise;

		expect(state.routeDataState.getState().loaderState.data).toBe('fast data');
	});

	it('does not apply minLoaderDuration when cache is fresh', async () => {
		const loader = vi.fn().mockResolvedValue('fresh');
		const routeItem = createMockRouteItem({ loader, staleTime: 10000 });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test' });
		expect(loader).toHaveBeenCalledOnce();

		loader.mockClear();

		await navigate({ pathname: '/test' });
		expect(loader).not.toHaveBeenCalled();
		expect(state.routeDataState.getState().loaderState.data).toBe('fresh');
	}, 10000);

	it('pairs optimistic route and loader commits inside a single view transition', async () => {
		// Regression: commitOptimisticState used to set loaderState synchronously while the route
		// change went through a deferred view transition. With animation enabled the new loader
		// data (object) landed while the old route (string page) still rendered — React crashed
		// on `<p>{data}</p>`. Both updates must share one transition callback.
		let transitionCb: (() => void) | null = null;
		vi.stubGlobal('document', {
			...document,
			startViewTransition: (cb: () => void) => {
				transitionCb = cb;
				return { ready: Promise.resolve(), finished: Promise.resolve() } as unknown as ViewTransition;
			},
		});
		const flushTransition = () => {
			transitionCb?.();
			transitionCb = null;
		};

		let resolveRevalidation!: (value: { value: number }) => void;
		const optimisticLoader = vi
			.fn()
			.mockResolvedValueOnce({ value: 1 })
			.mockImplementationOnce(
				() =>
					new Promise<{ value: number }>(resolve => {
						resolveRevalidation = resolve;
					})
			);
		const slowLoader = vi.fn().mockResolvedValue('slow payload');
		const slowRoute = createMockRouteItem({ path: '/slow', pattern: '/slow', loader: slowLoader });
		const optimisticRoute = createMockRouteItem({
			path: '/fast',
			pattern: '/fast',
			loader: optimisticLoader,
			staleTime: 100,
			optimistic: true,
		});
		routerConfig.configure({ routes: [slowRoute, optimisticRoute], isAnimated: true });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/fast' });
		flushTransition();
		await navigate({ pathname: '/slow' });
		flushTransition();
		expect(state.routeDataState.getState().location.pathname).toBe('/slow');
		expect(state.routeDataState.getState().loaderState.data).toBe('slow payload');

		vi.advanceTimersByTime(200);
		const revisit = navigate({ pathname: '/fast' });
		await vi.advanceTimersByTimeAsync(0);
		// The view transition is still deferred: the old route must still see its own data.
		expect(state.routeDataState.getState().location.pathname).toBe('/slow');
		expect(state.routeDataState.getState().loaderState.data).toBe('slow payload');

		flushTransition();
		expect(state.routeDataState.getState().status).toBe('optimistic');
		expect(state.routeDataState.getState().loaderState.data).toEqual({ value: 1 });

		resolveRevalidation({ value: 2 });
		await revisit;
		flushTransition();
		expect(state.routeDataState.getState().status).toBe('active');
		expect(state.routeDataState.getState().loaderState.data).toEqual({ value: 2 });
	});

	describe('polling', () => {
		it('updates loader data on every polling tick while the route is active', async () => {
			const loader = vi.fn().mockResolvedValueOnce('v1').mockResolvedValue('v2');
			const routeItem = createMockRouteItem({ loader, pollingInterval: 1000, staleTime: 500 });
			routerConfig.configure({ routes: [routeItem] });

			revalidateCache = createRevalidateCache(state);
			navigate = createNavigate(state, revalidateCache);

			await navigate({ pathname: '/test' });
			expect(state.routeDataState.getState().loaderState.data).toBe('v1');
			expect(loader).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(1000);
			expect(loader).toHaveBeenCalledTimes(2);
			expect(state.routeDataState.getState().loaderState.data).toBe('v2');
		});

		it('refetches on every polling tick even without staleTime', async () => {
			// Regression (playground Live page): without staleTime the cache is perpetually
			// fresh, so polling ticks kept returning the cached value and the loader was never
			// called again. Polling is an explicit refetch signal and must bypass freshness.
			const loader = vi.fn().mockResolvedValueOnce('v1').mockResolvedValue('v2');
			const routeItem = createMockRouteItem({ loader, pollingInterval: 1000 });
			routerConfig.configure({ routes: [routeItem] });

			revalidateCache = createRevalidateCache(state);
			navigate = createNavigate(state, revalidateCache);

			await navigate({ pathname: '/test' });
			expect(state.routeDataState.getState().loaderState.data).toBe('v1');
			expect(loader).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(1000);
			expect(loader).toHaveBeenCalledTimes(2);
			expect(state.routeDataState.getState().loaderState.data).toBe('v2');
		});

		it('stops polling after leaving the route', async () => {
			const loader = vi.fn().mockResolvedValue('v1');
			const routeItem = createMockRouteItem({ loader, pollingInterval: 1000, staleTime: 500 });
			const plainItem = createMockRouteItem({ path: '/other', pattern: '/other' });
			routerConfig.configure({ routes: [routeItem, plainItem] });

			revalidateCache = createRevalidateCache(state);
			navigate = createNavigate(state, revalidateCache);

			await navigate({ pathname: '/test' });
			expect(loader).toHaveBeenCalledTimes(1);

			await navigate({ pathname: '/other' });
			await vi.advanceTimersByTimeAsync(5000);
			expect(loader).toHaveBeenCalledTimes(1);
		});
	});
});

describe('useAction', () => {
	beforeEach(() => {
		routerConfig.configure({
			routes: [],
			maxCacheSize: 10,
			isAnimated: false,
		});
		vi.spyOn(history, 'pushState').mockImplementation(() => {});
		// The outer suite stubs `document` with a plain object (startViewTransition mock),
		// which breaks @testing-library/react rendering — restore the real jsdom document.
		vi.unstubAllGlobals();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('calls the current route action after navigation', async () => {
		const actionA = vi.fn(async () => 'saved-a');
		const actionB = vi.fn(async () => 'saved-b');
		const routeA = createMockRouteItem({
			path: '/a',
			pattern: '/a',
			actions: () => ({ save: actionA }),
		});
		const routeB = createMockRouteItem({
			path: '/b',
			pattern: '/b',
			actions: () => ({ save: actionB }),
		});
		routerConfig.configure({ routes: [routeA, routeB] });
		const instance = createRouterInstance(useSyncExternalStore);

		await instance.runtime.navigate({ pathname: '/a' });
		const { result } = renderHook(() => instance.hooks.useAction('save'));
		await instance.runtime.navigate({ pathname: '/b' });

		let submitResult: unknown;
		await act(async () => {
			submitResult = await result.current({ title: 'hello' });
		});

		expect(actionB).toHaveBeenCalledWith({ title: 'hello' });
		expect(actionA).not.toHaveBeenCalled();
		expect(submitResult).toEqual({ data: 'saved-b', error: null });
	});

	it('returns error instead of crashing render when action is missing', async () => {
		const route = createMockRouteItem({
			path: '/a',
			pattern: '/a',
			actions: () => ({}),
		});
		routerConfig.configure({ routes: [route] });
		const instance = createRouterInstance(useSyncExternalStore);

		await instance.runtime.navigate({ pathname: '/a' });

		let submit!: (input: Record<string, unknown>) => Promise<{ data: unknown; error: Error | null }>;
		expect(() => {
			const { result } = renderHook(() => instance.hooks.useAction('missing'));
			submit = result.current;
		}).not.toThrow();

		let submitResult: { data: unknown; error: unknown } | undefined;
		await act(async () => {
			submitResult = await submit({});
		});

		expect(submitResult?.data).toBeNull();
		expect(submitResult?.error).toBeInstanceOf(Error);
	});

	it('invalidates current route and calls onSuccess after submit', async () => {
		const loader = vi.fn(async () => 'v1');
		const action = vi.fn(async () => 'saved');
		const onSuccess = vi.fn();
		const route = createMockRouteItem({
			path: '/a',
			pattern: '/a',
			loader,
			actions: () => ({ save: action }),
		});
		routerConfig.configure({ routes: [route] });
		const instance = createRouterInstance(useSyncExternalStore);

		await instance.runtime.navigate({ pathname: '/a' });
		expect(loader).toHaveBeenCalledTimes(1);

		const { result } = renderHook(() => instance.hooks.useAction('save', { onSuccess }));

		let submitResult: unknown;
		await act(async () => {
			submitResult = await result.current({});
		});

		expect(submitResult).toEqual({ data: 'saved', error: null });
		expect(onSuccess).toHaveBeenCalledWith('saved');
		expect(loader).toHaveBeenCalledTimes(2);
	});
});

describe('useNavigate path params', () => {
	beforeEach(() => {
		routerConfig.configure({
			routes: [],
			maxCacheSize: 10,
			isAnimated: false,
		});
		vi.spyOn(history, 'pushState').mockImplementation(() => {});
		vi.unstubAllGlobals();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('navigates by path template and params', async () => {
		const loader = vi.fn(async () => 'user data');
		const routeItem = createMockRouteItem({ path: '/user/:id', pattern: '/user/:id', loader });
		routerConfig.configure({ routes: [routeItem] });
		const instance = createRouterInstance(useSyncExternalStore);

		const { result: navigateResult } = renderHook(() => instance.hooks.useNavigate());
		await act(async () => {
			await navigateResult.current({ path: '/user/:id', params: { id: '7' } });
		});

		const { result: locationResult } = renderHook(() =>
			instance.hooks.useRouteDataSelector(state => state.location.pathname)
		);
		expect(locationResult.current).toBe('/user/7');
		const { result: paramsResult } = renderHook(() => instance.hooks.useParams<{ id: string }>());
		expect(paramsResult.current).toEqual({ id: '7' });
		expect(history.pushState).toHaveBeenCalledWith(null, '', '/user/7');
	});
});
