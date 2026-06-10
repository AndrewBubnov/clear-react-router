import { describe, it, expect } from 'vitest';
import { comparePaths } from '../utils/utils.ts';
import type { RouteItem } from '../types/global';

describe('comparePaths', () => {
	const createRouteItem = (path: string, params?: RouteItem['params']): RouteItem => ({
		path,
		params,
		element: <div />,
	});

	it('matches static paths', () => {
		const route = createRouteItem('/about');
		expect(comparePaths(route, '/about')).toBe(true);
		expect(comparePaths(route, '/contact')).toBe(false);
	});

	it('matches dynamic paths with one parameter', () => {
		const route = createRouteItem('/user', [{ key: 'user', value: 'userId' }]);

		expect(comparePaths(route, '/user/123')).toBe(true);
		expect(comparePaths(route, '/user/john')).toBe(true);
		expect(comparePaths(route, '/user/123/post')).toBe(false);
		expect(comparePaths(route, '/user')).toBe(false); // не хватает параметра
	});

	it('matches nested dynamic paths', () => {
		const route = createRouteItem('/post/comment', [
			{ key: 'post', value: 'postId' },
			{ key: 'comment', value: 'commentId' },
		]);

		expect(comparePaths(route, '/post/42/comment/7')).toBe(true);
		expect(comparePaths(route, '/post/42/comment/7/extra')).toBe(false);
		expect(comparePaths(route, '/post/42')).toBe(false);
	});

	it('matches dynamic path when parameter is at the end', () => {
		const route = createRouteItem('/user', [{ key: 'user', value: 'userId' }]);
		expect(comparePaths(route, '/user/123')).toBe(true);
	});

	it('does not match when static segments differ', () => {
		const route = createRouteItem('/user/profile', [{ key: 'user', value: 'userId' }]);
		expect(comparePaths(route, '/admin/123/profile')).toBe(false);
		expect(comparePaths(route, '/user/123')).toBe(false);
	});

	it('handles root path', () => {
		const route = createRouteItem('');
		expect(comparePaths(route, '/')).toBe(true);
		expect(comparePaths(route, '/about')).toBe(false);
	});
});
