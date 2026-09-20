import { describe, it, expect } from 'vitest';
import { createRouter } from '../../creators/createRouter';
import { lazy } from '../../utils/lazy';
import { Link } from '../../components/Link';
import { TestElement } from '../common';
import { ClientRouteItem } from '../../types';

const Test = () => {
	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			<h3>Test</h3>
			<Link to="/">
				<span>To home page</span>
			</Link>
		</div>
	);
};

describe('createRouter', () => {
	it('flattens simple routes', () => {
		const routes: ClientRouteItem[] = [
			{ path: '/', element: TestElement },
			{ path: '/about', element: TestElement },
		];

		const result = createRouter(routes);
		expect(result).toHaveLength(2);
		expect(result[0].pattern).toBe('/');
		expect(result[1].pattern).toBe('/about');
	});

	it('flattens nested routes with correct patterns', () => {
		const routes: ClientRouteItem[] = [
			{
				path: '/user',
				element: TestElement,
				children: [
					{ path: '/:userId', element: TestElement },
					{ path: '/profile', element: TestElement },
				],
			},
		];

		const result = createRouter(routes);
		expect(result).toHaveLength(3);
		expect(result[0].pattern).toBe('/user');
		expect(result[1].pattern).toBe('/user/:userId');
		expect(result[2].pattern).toBe('/user/profile');
	});

	it('handles deeply nested routes', () => {
		const routes: ClientRouteItem[] = [
			{
				path: '/a',
				element: TestElement,
				children: [
					{
						path: '/b',
						element: TestElement,
						children: [{ path: '/c', element: TestElement }],
					},
				],
			},
		];

		const result = createRouter(routes);
		expect(result).toHaveLength(3);
		expect(result[0].pattern).toBe('/a');
		expect(result[1].pattern).toBe('/a/b');
		expect(result[2].pattern).toBe('/a/b/c');
	});

	it('handles lazy components', () => {
		const routes: ClientRouteItem[] = [{ path: '/lazy', element: lazy(() => Promise.resolve({ default: Test })) }];

		const result = createRouter(routes);
		expect(result).toHaveLength(1);
		expect(result[0].preloadElement).toBeDefined();
	});

	it('handles catch-all route (*)', () => {
		const routes: ClientRouteItem[] = [
			{ path: '/', element: TestElement },
			{ path: '*', element: TestElement },
		];

		const result = createRouter(routes);
		expect(result).toHaveLength(2);
		expect(result[1].pattern).toBe('/*');
	});

	it('preserves route properties', () => {
		const routes: ClientRouteItem[] = [
			{
				path: '/test',
				element: TestElement,
				loader: async () => 'data',
				staleTime: 1000,
				gcTime: 2000,
			},
		];

		const result = createRouter(routes);
		expect(result[0].loader).toBeDefined();
		expect(result[0].staleTime).toBe(1000);
		expect(result[0].gcTime).toBe(2000);
	});

	it('normalizes duplicate slashes in pattern', () => {
		const routes: ClientRouteItem[] = [
			{
				path: '/user',
				element: TestElement,
				children: [{ path: '//:userId//', element: TestElement }],
			},
		];

		const result = createRouter(routes);
		expect(result[1].pattern).toBe('/user/:userId/');
	});

	it('handles empty children array', () => {
		const routes: ClientRouteItem[] = [{ path: '/parent', element: TestElement, children: [] }];

		const result = createRouter(routes);
		expect(result).toHaveLength(1);
		expect(result[0].pattern).toBe('/parent');
	});
});
