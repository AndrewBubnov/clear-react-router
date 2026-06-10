import { describe, it, expect } from 'vitest';
import type { RouteItem } from '../types/global.ts';
import { comparePaths } from '../utils/utils.ts';

describe('comparePaths', () => {
	const createRouteItem = (path: string, params?: RouteItem['params']): RouteItem => ({
		path,
		element: <div />,
		params,
	});

	// it('matches static paths exactly', () => {
	// 	const route = createRouteItem('/about');
	// 	expect(comparePaths(route, '/about')).toBe(true);
	// 	expect(comparePaths(route, '/contact')).toBe(false);
	// });

	it('matches dynamic paths with parameters', () => {
		const route = createRouteItem('/user/:userId', [{ key: 'user', value: 'userId' }]);
		// console.log(createRouteItem('/user/:userId', [{ key: 'user', value: 'userId' }]));
		expect(comparePaths(route, '/user/123')).toBe(true);
		// expect(comparePaths(route, '/user/john')).toBe(true);
		// expect(comparePaths(route, '/user/123/post')).toBe(false);
	});

	// it('matches nested dynamic paths', () => {
	// 	const route = createRouteItem('/post/:postId/comment/:commentId', [
	// 		{ key: 'post', value: 'postId' },
	// 		{ key: 'comment', value: 'commentId' },
	// 	]);
	// 	expect(comparePaths(route, '/post/42/comment/7')).toBe(true);
	// 	expect(comparePaths(route, '/post/42')).toBe(false);
	// });
	//
	// it('matches wildcard path', () => {
	// 	const route = createRouteItem('*');
	// 	expect(comparePaths(route, '/anything')).toBe(true);
	// 	expect(comparePaths(route, '/user/123')).toBe(true);
	// });
});
