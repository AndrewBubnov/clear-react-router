import { describe, it, expect } from 'vitest';
import type { ClientRouteItem } from '../types/global';
import { createRouter } from '../utils/utils.ts';

describe('createRouter', () => {
	it('normalizes static routes', () => {
		const routes: ClientRouteItem[] = [
			{ path: '/', element: <div /> },
			{ path: '/about', element: <div /> },
		];
		const result = createRouter(routes);

		expect(result).toHaveLength(2);
		expect(result[0].path).toBe('/');
		expect(result[1].path).toBe('/about');
	});

	it('extracts params from dynamic routes', () => {
		const routes: ClientRouteItem[] = [{ path: '/user/:userId', element: <div /> }];
		const result = createRouter(routes);

		expect(result[0].params).toEqual([{ key: 'user', value: 'userId' }]);
	});

	it('handles nested routes with params', () => {
		const routes: ClientRouteItem[] = [
			{
				path: '/post/:postId',
				element: <div />,
				children: [{ path: '/comment/:commentId', element: <div /> }],
			},
		];
		const result = createRouter(routes);

		expect(result).toHaveLength(2);
		expect(result[0].params).toEqual([{ key: 'post', value: 'postId' }]);
		expect(result[1].params).toEqual([
			{ key: 'post', value: 'postId' },
			{ key: 'comment', value: 'commentId' },
		]);
	});

	it('handles wildcard route', () => {
		const routes: ClientRouteItem[] = [{ path: '*', element: <div /> }];
		const result = createRouter(routes);
		expect(result[0].path).toBe('*');
	});
});
