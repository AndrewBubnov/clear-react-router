import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSyncExternalStore } from 'react';
import { act, renderHook } from '@testing-library/react';
import { createRouterInstance } from '../../creators/createRouterInstance';
import { routerConfig } from '../../config/routerConfig';
import { createMockRouteItem } from '../common';

describe('cache snapshot', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
		vi.spyOn(history, 'pushState').mockImplementation(() => {});
		routerConfig.configure({ routes: [], maxCacheSize: 10, isAnimated: false, enableCacheSnapshot: false });
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('exposes entries after navigation when enableCacheSnapshot is true', async () => {
		const route = createMockRouteItem({ loader: vi.fn().mockResolvedValue('data') });
		routerConfig.configure({ routes: [route], enableCacheSnapshot: true });
		const instance = createRouterInstance(useSyncExternalStore);
		const { result } = renderHook(() => instance.hooks.useCacheSnapshot());

		await act(async () => {
			await instance.runtime.navigate({ pathname: '/test' });
		});

		expect(result.current).toContainEqual(
			expect.objectContaining({ path: '/test', data: 'data', isLoading: false })
		);
	});

	it('stays empty when enableCacheSnapshot is false', async () => {
		const route = createMockRouteItem({ loader: vi.fn().mockResolvedValue('data') });
		routerConfig.configure({ routes: [route], enableCacheSnapshot: false });
		const instance = createRouterInstance(useSyncExternalStore);
		const { result } = renderHook(() => instance.hooks.useCacheSnapshot());

		await act(async () => {
			await instance.runtime.navigate({ pathname: '/test' });
		});

		expect(result.current).toEqual([]);
	});

	it('syncs existing entries on demand', async () => {
		const route = createMockRouteItem({ loader: vi.fn().mockResolvedValue('data') });
		routerConfig.configure({ routes: [route], enableCacheSnapshot: false });
		const instance = createRouterInstance(useSyncExternalStore);
		const { result } = renderHook(() => instance.hooks.useCacheSnapshot());

		await act(async () => {
			await instance.runtime.navigate({ pathname: '/test' });
		});
		expect(result.current).toEqual([]);

		routerConfig.configure({ enableCacheSnapshot: true });
		act(() => instance.runtime.syncCacheSnapshot());

		expect(result.current).toContainEqual(expect.objectContaining({ path: '/test', data: 'data' }));
	});
});
