import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { createRevalidateCache } from '../runtime/revalidateCache';
import { createNavigate } from '../runtime/navigate';
import { createRouterInstance } from '../creators/createRouterInstance';
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

		expect(state.routeItemDataState.getState().location.pathname).toBe('/test');
		expect(state.loaderState.getState().data).toBe('route data');
		expect(state.routeItemDataState.getState().status).toBe('active');
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
		expect(state.routeItemDataState.getState().status).toBe('pending');

		resolveLoader('data');
		await navPromise;
		expect(state.routeItemDataState.getState().status).toBe('active');
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
		expect(state.routeItemDataState.getState().status).toBe('idle');
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

		expect(state.loaderState.getState().beforeLoadError).toBe(beforeLoadError);
		expect(state.routeItemDataState.getState().status).toBe('error');
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

		expect(state.loaderState.getState().loaderError).toBe(loaderError);
		expect(state.routeItemDataState.getState().status).toBe('error');
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

		expect(state.routeItemDataState.getState().location.pathname).toBe('/other');
	});

	it('navigates with search params', async () => {
		const loader = vi.fn().mockResolvedValue('data');
		const routeItem = createMockRouteItem({ loader });
		routerConfig.configure({ routes: [routeItem] });

		revalidateCache = createRevalidateCache(state);
		navigate = createNavigate(state, revalidateCache);

		await navigate({ pathname: '/test', search: '?foo=bar' });

		expect(state.routeItemDataState.getState().location.search).toBe('?foo=bar');
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

		expect(state.routeItemDataState.getState().location.pathname).toBe('/target');
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

		expect(state.routeItemDataState.getState().location.pathname).toBe('/test');
		expect(state.routeItemDataState.getState().status).toBe('active');
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

		expect(state.loaderState.getState().data).toBe('fast data');
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
		expect(state.loaderState.getState().data).toBe('fresh');
	}, 10000);
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
		const instance = createRouterInstance();

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
		const instance = createRouterInstance();

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
		const instance = createRouterInstance();

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
