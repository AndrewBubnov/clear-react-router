import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	getParams,
	comparePaths,
	formatSearchObject,
	parseWindowLocation,
	isMobile,
	sleep,
	getPartialLoaderArgs,
	isVerticalScroll,
	updateScrollMap,
	restoreScroll,
} from '../utils/utils';
import { create } from '../create';
import { TestElement } from './common';
import { Location, RouteItem } from '../types';

describe('utils', () => {
	describe('getParams', () => {
		it('extracts params from matching route pattern', () => {
			const location: Location = { pathname: '/user/123' };
			const routeItem: RouteItem = {
				path: '/user/:userId',
				element: TestElement,
				pattern: '/user/:userId',
			} as RouteItem;

			const params = getParams(location, routeItem);
			expect(params).toEqual({ userId: '123' });
		});

		it('returns empty object when routeItem is undefined', () => {
			const location: Location = { pathname: '/user/123' };
			const params = getParams(location, undefined);
			expect(params).toEqual({});
		});

		it('handles multiple params', () => {
			const location: Location = { pathname: '/post/456/comment/789' };
			const routeItem: RouteItem = {
				path: '/post/:postId/comment/:commentId',
				element: TestElement,
				pattern: '/post/:postId/comment/:commentId',
			} as RouteItem;

			const params = getParams(location, routeItem);
			expect(params).toEqual({ postId: '456', commentId: '789' });
		});
	});

	describe('comparePaths', () => {
		const routeItem: RouteItem = {
			path: '/user/:userId',
			element: TestElement,
			pattern: '/user/:userId',
		} as RouteItem;

		it('returns true for matching paths', () => {
			expect(comparePaths(routeItem, '/user/123')).toBe(true);
			expect(comparePaths(routeItem, '/user/abc')).toBe(true);
		});

		it('returns false for non-matching paths', () => {
			expect(comparePaths(routeItem, '/user')).toBe(false);
			expect(comparePaths(routeItem, '/user/123/extra')).toBe(false);
			expect(comparePaths(routeItem, '/post/123')).toBe(false);
		});
	});

	describe('formatSearchObject', () => {
		it('formats simple search object', () => {
			expect(formatSearchObject({ foo: 'bar', baz: 'qux' })).toBe('?foo=bar&baz=qux');
		});

		it('handles empty object', () => {
			expect(formatSearchObject({})).toBe('');
		});

		it('skips null and undefined values', () => {
			expect(formatSearchObject({ foo: 'bar', baz: null, qux: undefined })).toBe('?foo=bar');
		});

		it('converts numbers and booleans to strings', () => {
			expect(formatSearchObject({ count: 42, active: true })).toBe('?count=42&active=true');
		});
	});

	describe('parseWindowLocation', () => {
		it('parses location object', () => {
			const mockLocation = { pathname: '/test', search: '?foo=bar' };
			const result = parseWindowLocation(mockLocation as typeof window.location);
			expect(result).toEqual({ pathname: '/test', search: '?foo=bar' });
		});
	});

	describe('isMobile', () => {
		const originalMatchMedia = window.matchMedia;

		beforeEach(() => {
			vi.restoreAllMocks();
		});

		it('returns true when both coarse pointer and small screen', () => {
			window.matchMedia = vi
				.fn()
				.mockImplementationOnce(() => ({ matches: true }))
				.mockImplementationOnce(() => ({ matches: true }));

			expect(isMobile()).toBe(true);
		});

		it('returns false when not coarse pointer', () => {
			window.matchMedia = vi
				.fn()
				.mockImplementationOnce(() => ({ matches: false }))
				.mockImplementationOnce(() => ({ matches: true }));

			expect(isMobile()).toBe(false);
		});

		it('returns false when not small screen', () => {
			window.matchMedia = vi
				.fn()
				.mockImplementationOnce(() => ({ matches: true }))
				.mockImplementationOnce(() => ({ matches: false }));

			expect(isMobile()).toBe(false);
		});
	});

	describe('sleep', () => {
		it('resolves after specified time', async () => {
			const start = Date.now();
			await sleep(50);
			expect(Date.now() - start).toBeGreaterThanOrEqual(40);
		});
	});

	describe('getPartialLoaderArgs', () => {
		it('returns correct loader args', () => {
			const contextState = create({ foo: 'bar' });
			const location: Location = { pathname: '/user/123', search: '?q=test' };
			const routeItem: RouteItem = {
				path: '/user/:userId',
				element: TestElement,
				pattern: '/user/:userId',
			} as RouteItem;

			const args = getPartialLoaderArgs(contextState, location, routeItem);
			expect(args.params).toEqual({ userId: '123' });
			expect(args.context).toEqual({ foo: 'bar' });
			expect(args.setContext).toBeDefined();
			expect(args.searchParams).toEqual({ q: 'test' });
			expect(args.location).toBe(location);
		});
	});

	describe('isVerticalScroll', () => {
		it('returns true for vertically scrollable element', () => {
			const el = document.createElement('div');
			el.style.height = '100px';
			el.style.overflow = 'auto';
			const child = document.createElement('div');
			child.style.height = '200px';
			el.appendChild(child);
			document.body.appendChild(el);

			// jsdom doesn't compute layout, so we set scrollHeight directly
			Object.defineProperty(el, 'scrollHeight', { value: 200, configurable: true });
			Object.defineProperty(el, 'clientHeight', { value: 100, configurable: true });

			expect(isVerticalScroll(el)).toBe(true);
			document.body.removeChild(el);
		});

		it('returns false for non-scrollable element', () => {
			const el = document.createElement('div');
			el.style.height = '100px';
			el.style.overflow = 'hidden';
			document.body.appendChild(el);

			Object.defineProperty(el, 'scrollHeight', { value: 100, configurable: true });
			Object.defineProperty(el, 'clientHeight', { value: 100, configurable: true });

			expect(isVerticalScroll(el)).toBe(false);
			document.body.removeChild(el);
		});

		it('returns false for null', () => {
			expect(isVerticalScroll(null)).toBe(false);
		});
	});

	describe('updateScrollMap', () => {
		it('updates scroll map with window scroll position', () => {
			const routeItemDataState = create<{ routeItem?: RouteItem; location: Location; status: string }>({
				routeItem: { scrollRestoration: true } as RouteItem,
				location: { pathname: '/test' },
				status: 'idle',
			});
			const scrollMapState = create({});

			Object.defineProperty(document, 'scrollingElement', {
				value: { scrollTop: 100, scrollLeft: 50 },
				writable: true,
			});

			updateScrollMap(routeItemDataState, scrollMapState);

			const map = scrollMapState.getState();
			expect(map['/test']).toEqual([
				['__window_top__', 100],
				['__window_left__', 50],
			]);
		});
	});

	describe('restoreScroll', () => {
		beforeEach(() => {
			vi.useFakeTimers();
		});

		afterEach(() => {
			vi.useRealTimers();
		});

		it('restores window scroll position', () => {
			const scrollMap: Record<string, [string, number][]> = {
				'/test': [
					['__window_top__', 100],
					['__window_left__', 50],
				],
			};

			restoreScroll(scrollMap, '/test', 'auto');
			vi.runAllTimers();
			expect(window.scrollTo).toHaveBeenCalledWith({ top: 100, behavior: 'auto' });
			expect(window.scrollTo).toHaveBeenCalledWith({ left: 50, behavior: 'auto' });
		});

		it('restores element scroll position', () => {
			const el = document.createElement('div');
			el.id = 'scrollable';
			el.style.height = '100px';
			el.style.overflow = 'auto';
			el.scrollTo = vi.fn();
			const child = document.createElement('div');
			child.style.height = '200px';
			el.appendChild(child);
			document.body.appendChild(el);

			const scrollMap: Record<string, [string, number][]> = {
				'/test': [['scrollable', 50]],
			};

			restoreScroll(scrollMap, '/test', 'auto');
			vi.runAllTimers();
			expect(window.requestAnimationFrame).toHaveBeenCalled();
			expect(el.scrollTo).toHaveBeenCalledWith({ top: 50, behavior: 'auto' });
			document.body.removeChild(el);
		});
	});
});
