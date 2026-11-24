import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEffect, useState, type ReactNode } from 'react';
import { act, render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import {
	Router,
	Link,
	createRouter,
	useLoaderState,
	useLocation,
	useRouteStatus,
	useRouterContext,
	useNavigate,
} from '../..';
import { routes } from '../common';

const TEST_TIMEOUT = 10000;

describe('Router integration', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it('provides a navigation signal to beforeLoad and aborts it when superseded', async () => {
		window.history.pushState({}, '', '/slow-before');
		const observedSignals: AbortSignal[] = [];
		const signalRoutes = createRouter([
			{
				path: '/slow-before',
				element: <div>Slow Before</div>,
				beforeLoad: ({ signal }) => {
					observedSignals.push(signal);
					return new Promise(() => {});
				},
			},
			{ path: '/other-before', element: <div>Other Before</div> },
			{ path: '/', element: <div>Home</div> },
		]);
		const NavProbe = () => {
			const navigate = useNavigate();
			return <button data-testid="go-other" onClick={() => navigate('/other-before')} />;
		};
		render(
			<div>
				<NavProbe />
				<Router routes={signalRoutes} />
			</div>
		);

		await waitFor(() => expect(observedSignals.length).toBe(1));
		expect(observedSignals[0].aborted).toBe(false);

		fireEvent.click(screen.getByTestId('go-other'));
		await waitFor(() => expect(screen.getByText('Other Before')).toBeInTheDocument());

		expect(observedSignals[0].aborted).toBe(true);
	});

	it('keeps loader context updates when the context prop is a new inline object', async () => {
		window.history.pushState({}, '', '/ctx');
		const contextRoutes = createRouter([
			{
				path: '/ctx',
				element: <div>Ctx Page</div>,
				loader: ({ setContext }) => {
					setContext(prev => ({ ...prev, fromLoader: 'yes' }));
					return Promise.resolve('x');
				},
			},
			{ path: '/', element: <div>Home</div> },
		]);
		const ContextProbe = () => {
			const { context, setContext } = useRouterContext();
			// The context store is process-global; leave it empty for the next test.
			useEffect(() => () => setContext({}), [setContext]);
			return <span data-testid="keys">{Object.keys(context).sort().join(',')}</span>;
		};
		const Wrapper = () => {
			const [, force] = useState(0);
			return (
				<div>
					<button data-testid="rerender" onClick={() => force(n => n + 1)} />
					<ContextProbe />
					<Router routes={contextRoutes} context={{ app: 'v1' }} />
				</div>
			);
		};
		render(<Wrapper />);

		await waitFor(() => expect(screen.getByTestId('keys')).toHaveTextContent('app,fromLoader'));

		fireEvent.click(screen.getByTestId('rerender'));
		await waitFor(() => expect(screen.getByText('Ctx Page')).toBeInTheDocument());

		expect(screen.getByTestId('keys')).toHaveTextContent('app,fromLoader');
	});

	it('makes initial context available to beforeLoad', async () => {
		window.history.pushState({}, '', '/guarded');
		let observedContext: Record<string, unknown> | undefined;
		const initialContext = { isAuthorized: true };
		const guardedRoutes = createRouter([{ path: '/guarded', element: <div>Guarded Page</div> }]);

		render(
			<Router
				routes={guardedRoutes}
				context={initialContext}
				defaultBeforeLoad={({ context }) => {
					observedContext = context;
				}}
			/>
		);

		await waitFor(() => expect(observedContext).toEqual(initialContext));
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
					staleTime: Infinity,
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

describe('polling renders', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it(
		'does not re-render route subscribers on polling ticks',
		async () => {
			// Pins reference stability of the united store: a polling tick replaces only the
			// loader slice, so route/location/status subscribers must not re-render while the
			// loader subscriber does. (Passes on the old two-store design too — this is a
			// behavior pin, not a red-phase regression test.)
			let statusRenders = 0;
			let locationRenders = 0;
			let loaderRenders = 0;
			const StatusProbe = () => {
				statusRenders += 1;
				useRouteStatus();
				return null;
			};
			const LocationProbe = () => {
				locationRenders += 1;
				useLocation();
				return null;
			};
			const LoaderProbe = () => {
				loaderRenders += 1;
				const { data } = useLoaderState<string>();
				return <div>Live: {data}</div>;
			};
			const loader = vi.fn().mockResolvedValueOnce('v1').mockResolvedValue('v2');
			const pollingRoutes = createRouter([
				{ path: '/', element: <div>Home</div> },
				{
					path: '/live',
					element: (
						<div>
							<StatusProbe />
							<LocationProbe />
							<LoaderProbe />
						</div>
					),
					loader,
					pollingInterval: 100,
				},
				{ path: '*', element: <div>Not Found</div> },
			]);
			window.history.pushState({}, '', '/live');
			render(<Router routes={pollingRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Live: v1/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			statusRenders = 0;
			locationRenders = 0;
			loaderRenders = 0;
			await waitFor(
				() => {
					expect(screen.getByText(/Live: v2/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			await new Promise(resolve => setTimeout(resolve, 350));

			expect(loader.mock.calls.length).toBeGreaterThan(2);
			expect(loaderRenders).toBeGreaterThan(0);
			expect(statusRenders).toBe(0);
			expect(locationRenders).toBe(0);
		},
		TEST_TIMEOUT
	);
});

describe('layout rendering', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	it(
		'wraps the matched element in the route layout',
		async () => {
			const Layout = ({ children }: { children: ReactNode }) => (
				<div data-testid="layout">
					<nav>Chrome</nav>
					{children}
				</div>
			);
			const localRoutes = createRouter([{ path: '/', element: <div>Layout Home</div>, layout: Layout }]);
			render(<Router routes={localRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Layout Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const layout = screen.getByTestId('layout');
			expect(within(layout).getByText(/Chrome/i)).toBeInTheDocument();
			expect(within(layout).getByText(/Layout Home/i)).toBeInTheDocument();
		},
		TEST_TIMEOUT
	);

	it(
		'stacks nested layouts and keeps the outer shell mounted when entering a section',
		async () => {
			let shellMounts = 0;
			const AppShell = ({ children }: { children: ReactNode }) => {
				useEffect(() => {
					shellMounts += 1;
				}, []);
				return <div data-testid="shell">{children}</div>;
			};
			const SectionLayout = ({ children }: { children: ReactNode }) => (
				<div data-testid="section">{children}</div>
			);
			const localRoutes = createRouter([
				{
					path: '/',
					element: (
						<div>
							Home
							<Link to="/settings">
								<span>To settings</span>
							</Link>
						</div>
					),
					layout: AppShell,
					children: [
						{
							path: '/settings',
							element: <div>Settings</div>,
							layout: SectionLayout,
							children: [{ path: '/profile', element: <div>Profile</div> }],
						},
					],
				},
			]);
			window.history.pushState({}, '', '/');
			render(<Router routes={localRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Home/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			const mountsAtStart = shellMounts;
			expect(mountsAtStart).toBeGreaterThan(0);

			screen.getByText('To settings').click();
			await waitFor(
				() => {
					expect(screen.getByText(/Settings/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			const shell = screen.getByTestId('shell');
			expect(within(shell).getByTestId('section')).toBeInTheDocument();
			expect(within(shell).getByText(/Settings/i)).toBeInTheDocument();
			expect(shellMounts).toBe(mountsAtStart);
		},
		TEST_TIMEOUT
	);

	it(
		'inherits layout to children and keeps it mounted across child navigation',
		async () => {
			let layoutMounts = 0;
			const Layout = ({ children }: { children: ReactNode }) => {
				useEffect(() => {
					layoutMounts += 1;
				}, []);
				return <div data-testid="layout">{children}</div>;
			};
			const localRoutes = createRouter([
				{
					path: '/parent',
					element: <div>Parent</div>,
					layout: Layout,
					children: [
						{
							path: '/a',
							element: (
								<div>
									Child A
									<Link to="/parent/b">
										<span>To B</span>
									</Link>
								</div>
							),
						},
						{ path: '/b', element: <div>Child B</div> },
					],
				},
				{ path: '*', element: <div>Not Found</div> },
			]);
			window.history.pushState({}, '', '/parent/a');
			render(<Router routes={localRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Child A/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			const mountsAfterInitialRender = layoutMounts;
			expect(screen.getByTestId('layout')).toBeInTheDocument();
			expect(layoutMounts).toBeGreaterThan(0);

			screen.getByText('To B').click();
			await waitFor(
				() => {
					expect(screen.getByText(/Child B/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			expect(layoutMounts).toBe(mountsAfterInitialRender);
		},
		TEST_TIMEOUT
	);

	it(
		'keeps the layout mounted across a loader navigation',
		async () => {
			const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
			let layoutMounts = 0;
			const Layout = ({ children }: { children: ReactNode }) => {
				useEffect(() => {
					layoutMounts += 1;
				}, []);
				return <div data-testid="layout">{children}</div>;
			};
			const localRoutes = createRouter([
				{
					path: '/parent',
					element: (
						<div>
							Parent
							<Link to="/parent/b">
								<span>To B</span>
							</Link>
						</div>
					),
					layout: Layout,
					children: [
						{
							path: '/b',
							element: <div>Child B</div>,
							loader: async () => {
								await sleep(200);
								return 'b';
							},
						},
					],
				},
				{ path: '*', element: <div>Not Found</div> },
			]);
			window.history.pushState({}, '', '/parent');
			render(<Router routes={localRoutes} />);
			await waitFor(
				() => {
					expect(screen.getByText(/Parent/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			const mountsBeforeNavigation = layoutMounts;
			expect(mountsBeforeNavigation).toBeGreaterThan(0);

			screen.getByText('To B').click();
			await waitFor(
				() => {
					expect(screen.getByText(/Child B/i)).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);

			expect(layoutMounts).toBe(mountsBeforeNavigation);
		},
		TEST_TIMEOUT
	);
});

describe('keepPreviousData', () => {
	const buildFilterRoutes = (keepPreviousData: boolean) => {
		const resolvers: ((value: string) => void)[] = [];
		const rejections: ((error: Error) => void)[] = [];
		const loader = vi.fn((args: { searchParams: Record<string, string> }) => {
			const variant = args.searchParams.x ?? '1';
			if (variant === '3')
				return new Promise<string>((_, reject) => {
					rejections.push(reject);
				});
			if (variant === '1') return Promise.resolve(`data-1`);
			return new Promise<string>(resolve => {
				resolvers.push(resolve);
			});
		});
		const FilterView = () => {
			const { data } = useLoaderState<string>();
			const status = useRouteStatus();
			return (
				<div>
					<span data-testid="filter-status">{status}</span>
					<span data-testid="filter-data">{data}</span>
					<Link to="/filter?x=2">
						<span>To variant 2</span>
					</Link>
					<Link to="/filter?x=3">
						<span>To variant 3</span>
					</Link>
					<Link to="/other">
						<span>To other</span>
					</Link>
				</div>
			);
		};
		const routes = createRouter([
			{
				path: '/filter',
				element: <FilterView />,
				loader,
				keepPreviousData,
				loaderFallback: <div>Loading filter…</div>,
				errorElement: <div>Filter error</div>,
			},
			// A different element: pending here must never show the filter's data.
			{
				path: '/other',
				element: <div>Other page</div>,
				loader: () => new Promise<string>(() => {}),
				loaderFallback: <div>Loading other…</div>,
			},
		]);
		return { routes, loader, resolvers, rejections };
	};

	it(
		'keeps the previous loader data on screen while a new search variant loads',
		async () => {
			const { routes, resolvers } = buildFilterRoutes(true);
			window.history.pushState({}, '', '/filter?x=1');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-data')).toHaveTextContent('data-1');
				},
				{ timeout: 5000 }
			);

			screen.getByText('To variant 2').click();
			// Pending is committed for the new variant while the old data stays mounted.
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-status')).toHaveTextContent('pending');
				},
				{ timeout: 5000 }
			);
			expect(screen.getByTestId('filter-data')).toHaveTextContent('data-1');
			expect(screen.queryByText('Loading filter…')).not.toBeInTheDocument();

			await act(async () => {
				resolvers[0]('data-2');
			});
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-data')).toHaveTextContent('data-2');
				},
				{ timeout: 5000 }
			);
			expect(screen.getByTestId('filter-status')).toHaveTextContent('active');
		},
		TEST_TIMEOUT
	);

	it(
		'shows the fallback during pending without the flag',
		async () => {
			const { routes, resolvers } = buildFilterRoutes(false);
			window.history.pushState({}, '', '/filter?x=1');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-data')).toHaveTextContent('data-1');
				},
				{ timeout: 5000 }
			);

			screen.getByText('To variant 2').click();
			await waitFor(
				() => {
					expect(screen.getByText('Loading filter…')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			expect(screen.queryByTestId('filter-data')).not.toBeInTheDocument();

			await act(async () => {
				resolvers[0]('data-2');
			});
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-data')).toHaveTextContent('data-2');
				},
				{ timeout: 5000 }
			);
		},
		TEST_TIMEOUT
	);

	it(
		'shows the fallback when pending targets a different element',
		async () => {
			const { routes } = buildFilterRoutes(true);
			window.history.pushState({}, '', '/filter?x=1');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-data')).toHaveTextContent('data-1');
				},
				{ timeout: 5000 }
			);

			screen.getByText('To other').click();
			await waitFor(
				() => {
					expect(screen.getByText('Loading other…')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			expect(screen.queryByTestId('filter-data')).not.toBeInTheDocument();
		},
		TEST_TIMEOUT
	);

	it(
		'replaces kept data with the error element when the pending loader fails',
		async () => {
			const { routes, rejections } = buildFilterRoutes(true);
			window.history.pushState({}, '', '/filter?x=1');
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-data')).toHaveTextContent('data-1');
				},
				{ timeout: 5000 }
			);

			screen.getByText('To variant 3').click();
			await waitFor(
				() => {
					expect(screen.getByTestId('filter-status')).toHaveTextContent('pending');
				},
				{ timeout: 5000 }
			);
			expect(screen.getByTestId('filter-data')).toHaveTextContent('data-1');

			await act(async () => {
				rejections[0](new Error('boom'));
			});
			await waitFor(
				() => {
					expect(screen.getByText('Filter error')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
			expect(screen.queryByTestId('filter-data')).not.toBeInTheDocument();
		},
		TEST_TIMEOUT
	);
});
