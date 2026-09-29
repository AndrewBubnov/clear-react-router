import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Router, Link, createRouter, useLoaderState } from '../..';
import { routes } from '../common';

const TEST_TIMEOUT = 10000;

describe('Router integration', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it(
		'renders home page after loader completes',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'renders fallback while loader is pending',
		async () => {
			window.history.pushState({}, '', '/about');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Loading About/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'navigates via Link component',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const aboutLink = screen.getByText('To about page');
			aboutLink.click();

			await waitFor(
				() => {
					expect(screen.getByText(/About/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'renders NotFound for unknown routes',
		async () => {
			window.history.pushState({}, '', '/unknown');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Not Found/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'handles nested routes with params',
		async () => {
			window.history.pushState({}, '', '/user/123');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/User 123/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'shows loader fallback during navigation',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const aboutLink = screen.getByText('To about page');
			aboutLink.click();

			await waitFor(
				() => {
					expect(screen.getByText(/Loading About/i)).toBeInTheDocument();
				},
				{ timeout: 3000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'renders the target route errorElement when beforeLoad fails',
		async () => {
			const errorRoutes = createRouter([
				{
					path: '/',
					element: (
						<div>
							<h3>Error Home</h3>
							<Link to="/guarded">
								<span>To guarded page</span>
							</Link>
						</div>
					),
				},
				{
					path: '/guarded',
					element: <div>Guarded Page</div>,
					errorElement: <div>Guarded error occurred</div>,
					beforeLoad: async () => {
						throw new Error('not allowed');
					},
				},
				{ path: '*', element: <div>Not Found</div> },
			]);
			render(<Router routes={errorRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Error Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			screen.getByText('To guarded page').click();

			await waitFor(
				() => {
					expect(screen.getByText(/Guarded error occurred/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			expect(screen.queryByText(/Error Home/i)).not.toBeInTheDocument();
		},
		TEST_TIMEOUT
	);
});

describe('Link component', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it(
		'renders anchor with href',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			const link = screen.getByRole('link', { name: /to about page/i });
			expect(link).toHaveAttribute('href', '/about');
		},
		TEST_TIMEOUT
	);

	it(
		'navigates on click',
		async () => {
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const aboutLink = screen.getByText('To about page');
			aboutLink.click();

			await waitFor(
				() => {
					expect(screen.getByText(/About/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);
});

describe('fresh cache revisit', () => {
	const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it(
		'renders cached data instantly without flashing stale loader state',
		async () => {
			const FreshLive = () => {
				const { data } = useLoaderState<string>();
				return (
					<div>
						Live: {data.toUpperCase()}
						<Link to="/boom">
							<span>To boom</span>
						</Link>
					</div>
				);
			};
			const localRoutes = createRouter([
				{
					path: '/',
					element: (
						<div>
							<h3>Fresh Home</h3>
							<Link to="/live">
								<span>To live</span>
							</Link>
							<Link to="/boom">
								<span>To boom</span>
							</Link>
						</div>
					),
				},
				{
					path: '/live',
					element: <FreshLive />,
					loader: async () => {
						await sleep(150);
						return 'live data';
					},
				},
				{
					path: '/boom',
					element: <div>Boom</div>,
					errorElement: (
						<div>
							Boom error
							<Link to="/live">
								<span>Back to live</span>
							</Link>
						</div>
					),
					loader: async () => {
						throw new Error('boom');
					},
				},
				{ path: '*', element: <div>Not Found</div> },
			]);
			render(<Router routes={localRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Fresh Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			screen.getByText('To live').click();
			await waitFor(
				() => {
					expect(screen.getByText(/Live: LIVE DATA/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			screen.getByText('To boom').click();
			await waitFor(
				() => {
					expect(screen.getByText(/Boom error/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			// Second visit hits the fresh cache: the route renders immediately,
			// so the loader state must already match — no flash of the error
			// page's stale { data: null } (which would crash on toUpperCase).
			screen.getByText('Back to live').click();
			await waitFor(
				() => {
					expect(screen.getByText(/Live: LIVE DATA/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'renders prefetched data on first visit without flashing empty loader state',
		async () => {
			const PrefetchLive = () => {
				const { data } = useLoaderState<string>();
				return <div>Prefetched: {data.toUpperCase()}</div>;
			};
			const prefetchRoutes = createRouter([
				{
					path: '/',
					element: (
						<div>
							<h3>Prefetch Home</h3>
							<Link to="/plive">
								<span>To live</span>
							</Link>
						</div>
					),
				},
				{
					path: '/plive',
					element: <PrefetchLive />,
					loader: async () => {
						await sleep(50);
						return 'prefetched data';
					},
				},
				{ path: '*', element: <div>Not Found</div> },
			]);
			render(<Router routes={prefetchRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Prefetch Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			// Hover fills the cache before the click (150ms hover delay), so the
			// click lands on the fresh-cache path and renders instantly.
			fireEvent.mouseEnter(screen.getByText('To live'));
			await waitFor(
				() => {
					expect(screen.getByText(/Prefetch Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			await new Promise(resolve => setTimeout(resolve, 500));

			screen.getByText('To live').click();
			await waitFor(
				() => {
					expect(screen.getByText(/Prefetched: PREFETCHED DATA/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);
});
