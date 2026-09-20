// Demo application rendered only when VITE_E2E=1 (Playwright e2e tests).
// Not part of the published library (see src/clear-router).
import { useState } from 'react';
import {
	Router,
	Link,
	createRouter,
	useBlocker,
	useLoaderState,
	useLocation,
	useParams,
} from './clear-router';

declare global {
	interface Window {
		__loaderCalls?: Record<string, number>;
	}
}

const countCall = (key: string) => {
	window.__loaderCalls = window.__loaderCalls ?? {};
	window.__loaderCalls[key] = (window.__loaderCalls[key] ?? 0) + 1;
	return window.__loaderCalls[key];
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const Home = () => {
	const { state } = useLocation();
	const from = (state as { from?: string } | undefined)?.from;
	return (
		<div>
			<h1 data-testid="page-home">Home</h1>
			{from && <p data-testid="home-state">from: {from}</p>}
			<nav>
				<span data-testid="link-about">
					<Link to="/about">About</Link>
				</span>{' '}
				<span data-testid="link-about-noprefetch">
					<Link to="/about" prefetch="none">
						About (no prefetch)
					</Link>
				</span>{' '}
				<span data-testid="link-user">
					<Link to="/user/7" search={{ tab: 'info' }} state={{ from: 'home' }}>
						User 7
					</Link>
				</span>{' '}
				<span data-testid="link-form">
					<Link to="/form">Form</Link>
				</span>{' '}
				<span data-testid="link-long">
					<Link to="/long">Long page</Link>
				</span>
			</nav>
		</div>
	);
};

const About = () => {
	const { data } = useLoaderState<string>();
	return (
		<div>
			<h1 data-testid="page-about">About {data}</h1>
			<span data-testid="link-home">
				<Link to="/">Home</Link>
			</span>
		</div>
	);
};

const User = () => {
	const { userId } = useParams<{ userId: string }>();
	const { search, state, prevLocation } = useLocation();
	const from = (state as { from?: string } | undefined)?.from;
	return (
		<div>
			<h1 data-testid="page-user">User {userId}</h1>
			<p data-testid="user-search">search: {search}</p>
			{from && <p data-testid="user-state">from: {from}</p>}
			<span data-testid="link-back">
				<Link to={prevLocation?.pathname ?? '/'}>Back</Link>
			</span>
		</div>
	);
};

const FormPage = () => {
	const [value, setValue] = useState('');
	const dirty = value.length > 0;
	const { state, process, reset } = useBlocker(() => dirty);
	return (
		<div>
			<h1 data-testid="page-form">Form</h1>
			<div data-testid="blocker-state">{state}</div>
			<input data-testid="form-input" value={value} onChange={e => setValue(e.target.value)} />
			<span data-testid="link-home">
				<Link to="/">Home</Link>
			</span>
			{state === 'blocked' && (
				<div data-testid="blocker-dialog" role="alertdialog">
					<p>Leave without saving?</p>
					<button data-testid="blocker-confirm" onClick={process}>
						Leave
					</button>
					<button data-testid="blocker-cancel" onClick={reset}>
						Stay
					</button>
				</div>
			)}
		</div>
	);
};

const LongPage = () => (
	<div>
		<h1 data-testid="page-long">Long page</h1>
		<span data-testid="link-home">
			<Link to="/">Home</Link>
		</span>
		<div data-testid="long-spacer" style={{ height: '300vh' }} />
		<p data-testid="long-bottom">bottom</p>
		<span data-testid="link-home-bottom">
			<Link to="/">Home</Link>
		</span>
	</div>
);

const NotFound = () => (
	<div>
		<h1 data-testid="page-404">Not found</h1>
		<span data-testid="link-home">
			<Link to="/">Home</Link>
		</span>
	</div>
);

const routes = createRouter([
	{ path: '/', element: <Home /> },
	{
		path: '/about',
		element: <About />,
		loader: async () => {
			const n = countCall('about');
			await delay(300);
			const w = window as unknown as { __loaderDone?: Record<string, number> };
			w.__loaderDone = w.__loaderDone ?? {};
			w.__loaderDone.about = n;
			return `about-data-${n}`;
		},
	},
	{ path: '/user/:userId', element: <User /> },
	{ path: '/form', element: <FormPage /> },
	{ path: '/long', element: <LongPage />, scrollRestoration: true },
	{ path: '*', element: <NotFound /> },
]);

export const E2EDemo = () => <Router routes={routes} />;
