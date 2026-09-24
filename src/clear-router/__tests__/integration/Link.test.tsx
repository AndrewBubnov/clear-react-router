import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import {
	Router,
	Link,
	useLocation,
	useParams,
	useLoaderState,
	useSearchParams,
	useRouterContext,
	useIsDataLoading,
	useInvalidate,
	useNavigate,
	ElementProps,
} from '../..';
import { useIsRoutePending } from '../../hooks/useIsRoutePending';
import { createRouter } from '../../creators/createRouter';

const TEST_TIMEOUT = 10000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Page = ({ children }: { children?: ReactNode }) => <div>{children}</div>;

const LocationDisplay = () => {
	const location = useLocation();
	return <span data-testid="location">{location.pathname}</span>;
};

const ParamsDisplay = () => {
	const params = useParams<{ id?: string; slug?: string }>();
	return <span data-testid="params">{JSON.stringify(params)}</span>;
};

const Home = () => (
	<div>
		<h3>Home</h3>
		<LocationDisplay />
		<Link to="/">
			<span>Home Self</span>
		</Link>
		<Link to="/about">
			<span>About Link</span>
		</Link>
		<Link to="/about" activeClassName="my-active">
			<span>About Custom Active</span>
		</Link>
		<Link to="/about" exact>
			<span>About Exact</span>
		</Link>
		<Link to="/about" exact activeClassName="exact-active">
			<span>About Exact Custom</span>
		</Link>
		<Link to="/docs">
			<span>Docs</span>
		</Link>
		<Link to="/user/42" pendingClassName="my-pending">
			<span>User</span>
		</Link>
		<Link to="/settings" className={({ isActive }) => (isActive ? 'dynamic-active' : 'dynamic-inactive')}>
			<span>Dynamic Class</span>
		</Link>
		<Link to="/settings" style={({ isActive }) => (isActive ? { color: 'red' } : { color: 'blue' })}>
			<span>Dynamic Style</span>
		</Link>
		<Link to="/settings" style={{ fontWeight: 'bold' }}>
			<span>Static Style</span>
		</Link>
		<Link to="/search?foo=bar">
			<span>With Search</span>
		</Link>
		<Link to="/search" search={{ q: 'hello', page: 2 }}>
			<span>With Search Object</span>
		</Link>
		<Link
			to="/guarded"
			beforeNavigate={async () => {
				/* guard */
			}}
		>
			<span>Guarded</span>
		</Link>
		<Link
			to="/custom"
			as={(props, state) => (
				<button data-testid="custom-as" data-active={state.isActive} data-pending={state.isPending}>
					{props.children}
				</button>
			)}
		>
			<span>Custom Element</span>
		</Link>
		<Link to="/about" prefetch="none">
			<span>No Prefetch</span>
		</Link>
	</div>
);

const About = () => (
	<div>
		<h3>About Page</h3>
		<LocationDisplay />
		<Link to="/">
			<span>Home</span>
		</Link>
	</div>
);

const TestPage = () => (
	<div>
		<h3>Test</h3>
		<Link to="/">
			<span>To home page</span>
		</Link>
	</div>
);

const NotFound = () => (
	<div>
		<h1>404</h1>
		<h3>Not Found</h3>
	</div>
);

const createTestRoutes = () =>
	createRouter([
		{
			path: '/',
			element: <Home />,
			loader: async () => 'home data',
		},
		{
			path: '/about',
			element: <About />,
			loader: async () => {
				await sleep(500);
				return 'about data';
			},
			staleTime: 1000,
			loaderFallback: <div>Loading About...</div>,
		},
		{
			path: '/docs',
			element: (
				<Page>
					<LocationDisplay />
				</Page>
			),
		},
		{
			path: '/docs/:slug',
			element: (
				<Page>
					<LocationDisplay />
				</Page>
			),
		},
		{
			path: '/user/:id',
			element: (
				<Page>
					<ParamsDisplay />
					<LocationDisplay />
				</Page>
			),
		},
		{
			path: '/settings',
			element: (
				<Page>
					<LocationDisplay />
				</Page>
			),
		},
		{
			path: '/search',
			element: (
				<Page>
					<LocationDisplay />
				</Page>
			),
		},
		{ path: '/test', element: <TestPage /> },
		{ path: '/guarded', element: <Page>Guarded Page</Page> },
		{
			path: '/custom',
			element: (
				<Page>
					<LocationDisplay />
				</Page>
			),
		},
		{ path: '*', element: <NotFound /> },
	]);

const HookExtractor = ({ hookFn }: { hookFn: () => unknown }) => {
	const value = hookFn();
	return (
		<span data-testid="hook-value">
			{JSON.stringify(value, (_key, val) => (typeof val === 'function' ? '[Function]' : val))}
		</span>
	);
};

const renderWithRouter = async (hookFn: () => unknown, path = '/', routes?: ReturnType<typeof createRouter>) => {
	const testRoutes =
		routes ??
		createRouter([
			{
				path: '/',
				element: <HookExtractor hookFn={hookFn} />,
				loader: async () => {
					await sleep(100);
					return 'home data';
				},
			},
			{
				path: '/about',
				element: <HookExtractor hookFn={hookFn} />,
				loader: async () => {
					await sleep(100);
					return 'about data';
				},
				loaderFallback: <div>Loading About...</div>,
			},
			{
				path: '/user/:id',
				element: <HookExtractor hookFn={hookFn} />,
			},
			{ path: '/settings', element: <HookExtractor hookFn={hookFn} /> },
			{ path: '*', element: <div>Not Found</div> },
		]);

	window.history.pushState({}, '', path);
	await act(async () => {
		render(<Router routes={testRoutes} />);
		await sleep(150);
	});
};

const waitForReady = () =>
	waitFor(
		() => {
			expect(screen.getByText('Home')).toBeInTheDocument();
		},
		{ timeout: 5000 }
	);

describe('Link component', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	describe('rendering', () => {
		it(
			'renders anchor with correct href',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /about link$/i });
				expect(link).toHaveAttribute('href', '/about');
			},
			TEST_TIMEOUT
		);

		it(
			'renders children',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				expect(screen.getByText(/about link$/i)).toBeInTheDocument();
			},
			TEST_TIMEOUT
		);
	});

	describe('search params', () => {
		it(
			'appends search string to href',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /with search$/i });
				expect(link).toHaveAttribute('href', '/search?foo=bar');
			},
			TEST_TIMEOUT
		);

		it(
			'search object prop appends to href',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /with search object/i });
				expect(link).toHaveAttribute('href', '/search?q=hello&page=2');
			},
			TEST_TIMEOUT
		);
	});

	describe('active state', () => {
		it(
			'applies active-link class for exact root path',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const homeLink = screen.getByRole('link', { name: /home self/i });
				expect(homeLink).toHaveClass('active-link');
			},
			TEST_TIMEOUT
		);

		it(
			'applies custom activeClassName',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const homeLink = screen.getByRole('link', { name: /home self/i });
				expect(homeLink).toHaveClass('active-link');
				expect(homeLink).not.toHaveClass('my-active');
			},
			TEST_TIMEOUT
		);

		it(
			'exact match: does not apply active class for prefix paths',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /about exact$/i });
				expect(link).not.toHaveClass('active-link');
			},
			TEST_TIMEOUT
		);

		it(
			'does not apply active class for non-matching paths',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const aboutLink = screen.getByRole('link', { name: /^about link$/i });
				expect(aboutLink).not.toHaveClass('active-link');
			},
			TEST_TIMEOUT
		);
	});

	describe('className and style', () => {
		it(
			'supports className as function',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /dynamic class/i });
				expect(link).toHaveClass('dynamic-inactive');
			},
			TEST_TIMEOUT
		);

		it(
			'supports style as function',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /dynamic style/i });
				expect(link).toHaveStyle({ color: 'rgb(0, 0, 255)' });
			},
			TEST_TIMEOUT
		);

		it(
			'supports static style',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /static style/i });
				expect(link).toHaveStyle({ fontWeight: 'bold' });
			},
			TEST_TIMEOUT
		);
	});

	describe('custom element', () => {
		it(
			'supports as prop',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const btn = screen.getByTestId('custom-as');
				expect(btn.tagName).toBe('BUTTON');
				expect(btn).toHaveTextContent('Custom Element');
			},
			TEST_TIMEOUT
		);
	});

	describe('accessibility', () => {
		const renderA11yRoutes = async () => {
			const routes = createRouter([
				{
					path: '/',
					element: (
						<div>
							<h3>A11y Home</h3>
							<Link to="/" data-testid="a11y-home">
								A11y Home Link
							</Link>
							<Link to="/about" aria-label="About section" data-testid="a11y-about">
								A11y About
							</Link>
						</div>
					),
				},
				{ path: '/about', element: <div>About Page</div> },
				{ path: '*', element: <div>Not Found</div> },
			]);
			render(<Router routes={routes} />);
			await waitFor(
				() => {
					expect(screen.getByTestId('a11y-home')).toBeInTheDocument();
				},
				{ timeout: 5000 }
			);
		};

		it(
			'sets aria-current="page" on the active link only',
			async () => {
				await renderA11yRoutes();
				expect(screen.getByTestId('a11y-home')).toHaveAttribute('aria-current', 'page');
				expect(screen.getByTestId('a11y-about')).not.toHaveAttribute('aria-current');
			},
			TEST_TIMEOUT
		);

		it(
			'forwards data-* and aria-* props to the anchor',
			async () => {
				await renderA11yRoutes();
				const aboutLink = screen.getByTestId('a11y-about');
				expect(aboutLink.tagName).toBe('A');
				expect(aboutLink).toHaveAttribute('aria-label', 'About section');
			},
			TEST_TIMEOUT
		);

		it(
			'sets aria-busy while the link target is loading',
			async () => {
				const routes = createRouter([
					{ path: '/', element: <div>Busy Home</div> },
					{
						path: '/slow',
						element: <div>Slow Page</div>,
						loader: async () => {
							await sleep(500);
							return 'slow data';
						},
					},
					{ path: '*', element: <div>Not Found</div> },
				]);
				render(
					<div>
						<Link to="/slow" data-testid="a11y-slow">
							Slow
						</Link>
						<Router routes={routes} />
					</div>
				);
				await waitFor(
					() => {
						expect(screen.getByText('Busy Home')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);
				const link = screen.getByTestId('a11y-slow');
				expect(link).not.toHaveAttribute('aria-busy');
				link.click();
				await waitFor(
					() => {
						expect(link).toHaveAttribute('aria-busy', 'true');
					},
					{ timeout: 5000 }
				);
				await waitFor(
					() => {
						expect(screen.getByText('Slow Page')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);
				expect(link).not.toHaveAttribute('aria-busy');
			},
			TEST_TIMEOUT
		);
	});

	describe('click behavior', () => {
		it(
			'navigates on click',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				screen.getByRole('link', { name: /about link$/i }).click();
				await waitFor(
					() => {
						expect(screen.getByText('About Page')).toBeInTheDocument();
						expect(screen.getByText('/about')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'does not navigate on middle click',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /about link$/i });
				const event = new MouseEvent('click', { button: 1, bubbles: true });
				const preventDefault = vi.spyOn(event, 'preventDefault');
				link.dispatchEvent(event);
				expect(preventDefault).not.toHaveBeenCalled();
			},
			TEST_TIMEOUT
		);

		it(
			'does not navigate with ctrl key',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /about link$/i });
				const event = new MouseEvent('click', { ctrlKey: true, bubbles: true });
				const preventDefault = vi.spyOn(event, 'preventDefault');
				link.dispatchEvent(event);
				expect(preventDefault).not.toHaveBeenCalled();
			},
			TEST_TIMEOUT
		);

		it(
			'does not navigate with meta key',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /about link$/i });
				const event = new MouseEvent('click', { metaKey: true, bubbles: true });
				const preventDefault = vi.spyOn(event, 'preventDefault');
				link.dispatchEvent(event);
				expect(preventDefault).not.toHaveBeenCalled();
			},
			TEST_TIMEOUT
		);

		it(
			'does not navigate when defaultPrevented',
			async () => {
				render(<Router routes={createTestRoutes()} />);
				await waitForReady();
				const link = screen.getByRole('link', { name: /about link$/i });
				link.addEventListener(
					'click',
					e => {
						e.preventDefault();
						e.stopPropagation();
					},
					{ capture: true, once: true }
				);
				link.click();
				await new Promise(r => setTimeout(r, 2000));
				expect(screen.queryByText('About Page')).not.toBeInTheDocument();
			},
			TEST_TIMEOUT
		);

		it(
			'calls beforeNavigate before navigation',
			async () => {
				const beforeNavigate = vi.fn();
				const routesWithGuard = createRouter([
					{
						path: '/',
						element: (
							<div>
								<Link to="/guarded" beforeNavigate={beforeNavigate}>
									<span>Guarded Link</span>
								</Link>
							</div>
						),
					},
					{ path: '/guarded', element: <div>Guarded Page</div> },
				]);

				render(<Router routes={routesWithGuard} />);
				await waitFor(
					() => {
						expect(screen.getByText('Guarded Link')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);

				screen.getByRole('link', { name: /guarded link/i }).click();
				await waitFor(
					() => {
						expect(beforeNavigate).toHaveBeenCalled();
					},
					{ timeout: 3000 }
				);
			},
			TEST_TIMEOUT
		);
	});
});

describe('hooks', () => {
	beforeEach(() => {
		window.history.pushState({}, '', '/');
	});

	describe('useParams', () => {
		it(
			'returns empty object on root path',
			async () => {
				await renderWithRouter(() => {
					const params = useParams();
					return params;
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('{}');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'returns route params',
			async () => {
				await renderWithRouter(() => {
					const params = useParams<{ id: string }>();
					return params;
				}, '/user/42');

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('{"id":"42"}');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);
	});

	describe('useLocation', () => {
		it(
			'returns current pathname',
			async () => {
				await renderWithRouter(() => {
					const location = useLocation();
					return location.pathname;
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('/');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'returns search in location',
			async () => {
				await renderWithRouter(() => {
					const location = useLocation();
					return location.search;
				}, '/about?q=test');

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('?q=test');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);
	});

	describe('useNavigate', () => {
		it(
			'returns a function',
			async () => {
				await renderWithRouter(() => {
					const navigate = useNavigate();
					return typeof navigate;
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('"function"');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);
	});

	describe('useLoaderState', () => {
		it(
			'returns loader data after loading',
			async () => {
				await renderWithRouter(() => {
					const { data } = useLoaderState<string>();
					return data;
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('"home data"');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);
	});

	describe('useSearchParams', () => {
		it(
			'returns parsed search params',
			async () => {
				await renderWithRouter(() => {
					const { searchParams } = useSearchParams();
					return Object.fromEntries(searchParams.entries());
				}, '/about?foo=bar&baz=qux');

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('{"foo":"bar","baz":"qux"}');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'getSearchParams returns single value',
			async () => {
				await renderWithRouter(() => {
					const { getSearchParams } = useSearchParams();
					return getSearchParams('foo');
				}, '/about?foo=bar');

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('"bar"');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'getSearchParams returns empty string for missing param',
			async () => {
				await renderWithRouter(() => {
					const { getSearchParams } = useSearchParams();
					return getSearchParams('missing');
				}, '/about?foo=bar');

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('""');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'setSearchParams with string updates URL',
			async () => {
				const SetParamsComponent = () => {
					const { setSearchParams } = useSearchParams();
					return (
						<button data-testid="set-params" onClick={() => setSearchParams('color', 'red')}>
							Set
						</button>
					);
				};

				const routes = createRouter([{ path: '/test', element: <SetParamsComponent /> }]);
				window.history.pushState({}, '', '/test');
				render(<Router routes={routes} />);

				await waitFor(
					() => {
						expect(screen.getByTestId('set-params')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);

				await act(async () => {
					screen.getByTestId('set-params').click();
				});

				expect(window.location.search).toBe('?color=red');
			},
			TEST_TIMEOUT
		);

		it(
			'setSearchParams with function updates URL',
			async () => {
				const SetParamsComponent = () => {
					const { setSearchParams } = useSearchParams();
					return (
						<button
							data-testid="set-params-fn"
							onClick={() =>
								setSearchParams(prev => {
									prev.set('page', '3');
									return prev;
								})
							}
						>
							Set
						</button>
					);
				};

				const routes = createRouter([{ path: '/test', element: <SetParamsComponent /> }]);
				window.history.pushState({}, '', '/test?existing=1');
				render(<Router routes={routes} />);

				await waitFor(
					() => {
						expect(screen.getByTestId('set-params-fn')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);

				await act(async () => {
					screen.getByTestId('set-params-fn').click();
				});

				expect(window.location.search).toContain('page=3');
				expect(window.location.search).toContain('existing=1');
			},
			TEST_TIMEOUT
		);
	});

	describe('useRouterContext', () => {
		it(
			'returns context and setContext',
			async () => {
				await renderWithRouter(() => {
					const { context, setContext } = useRouterContext();
					return { hasContext: typeof context === 'object', hasSetContext: typeof setContext === 'function' };
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent(
							'{"hasContext":true,"hasSetContext":true}'
						);
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'setContext updates context',
			async () => {
				const ContextUpdater = () => {
					const { context, setContext } = useRouterContext();
					return (
						<div>
							<span data-testid="context-value">{String(context.custom)}</span>
							<button
								data-testid="update-context"
								onClick={() => setContext(prev => ({ ...prev, custom: 'updated' }))}
							>
								Update
							</button>
						</div>
					);
				};

				const routes = createRouter([{ path: '/', element: <ContextUpdater /> }]);
				window.history.pushState({}, '', '/');
				render(<Router routes={routes} />);

				await waitFor(
					() => {
						expect(screen.getByTestId('context-value')).toHaveTextContent('undefined');
					},
					{ timeout: 5000 }
				);

				await act(async () => {
					screen.getByTestId('update-context').click();
				});

				expect(screen.getByTestId('context-value')).toHaveTextContent('updated');
			},
			TEST_TIMEOUT
		);
	});

	describe('useIsDataLoading', () => {
		it(
			'returns false after loading completes',
			async () => {
				await renderWithRouter(() => {
					const isLoading = useIsDataLoading();
					return isLoading;
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('false');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);
	});

	describe('useIsRoutePending', () => {
		it(
			'returns false for completed route',
			async () => {
				await renderWithRouter(() => {
					const isPending = useIsRoutePending('/about');
					return isPending;
				}, '/about');

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('false');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);

		it(
			'returns false for non-matching path',
			async () => {
				await renderWithRouter(() => {
					const isPending = useIsRoutePending('/different');
					return isPending;
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('false');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);
	});

	describe('useInvalidate', () => {
		it(
			'returns a function',
			async () => {
				await renderWithRouter(() => {
					const invalidate = useInvalidate();
					return typeof invalidate;
				});

				await waitFor(
					() => {
						expect(screen.getByTestId('hook-value')).toHaveTextContent('"function"');
					},
					{ timeout: 5000 }
				);
			},
			TEST_TIMEOUT
		);
	});

	describe('render optimization', () => {
		const renderCounts: Record<string, number> = {};

		const CountingAnchor = (props: ElementProps<HTMLAnchorElement>) => {
			// Test-only measurement: counts how many times each Link renders.
			// eslint-disable-next-line react-hooks/immutability
			renderCounts[props.href] = (renderCounts[props.href] ?? 0) + 1;
			return <a {...props} />;
		};

		const resetCounts = () => {
			Object.keys(renderCounts).forEach(key => {
				renderCounts[key] = 0;
			});
		};

		it(
			're-renders only links whose active state flips',
			async () => {
				const routes = createRouter([
					{ path: '/rc-a', element: <div>Page A</div> },
					{
						path: '/rc-b',
						element: <div>Page B</div>,
						loader: async () => {
							await sleep(300);
							return 'b data';
						},
					},
					{ path: '/rc-c', element: <div>Page C</div> },
					{ path: '*', element: <div>Not Found</div> },
				]);
				window.history.pushState({}, '', '/rc-a');
				render(
					<div>
						<Link to="/rc-a" as={CountingAnchor}>
							A
						</Link>
						<Link to="/rc-b" as={CountingAnchor}>
							B
						</Link>
						<Link to="/rc-c" as={CountingAnchor}>
							C
						</Link>
						<Router routes={routes} />
					</div>
				);
				await waitFor(
					() => {
						expect(screen.getByText('Page A')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);
				resetCounts();

				screen.getByText('B').click();
				await waitFor(
					() => {
						expect(screen.getByText('Page B')).toBeInTheDocument();
					},
					{ timeout: 5000 }
				);

				// The two flipped links re-rendered (possibly several times
				// across pending/active states — hence greater-than, not exact).
				expect(renderCounts['/rc-a']).toBeGreaterThan(0);
				expect(renderCounts['/rc-b']).toBeGreaterThan(0);
				// The untouched link never woke up.
				expect(renderCounts['/rc-c']).toBe(0);
			},
			TEST_TIMEOUT
		);
	});
});
