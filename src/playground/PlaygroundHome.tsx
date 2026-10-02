import { Link } from '../clear-router';

const demos = [
	{ to: '/playground/settings', title: 'Settings', text: 'Router settings applied live: transitions, animation duration, cache size.' },
	{ to: '/playground/retry', title: 'Retry', text: 'Flaky loader (fails ~50%) with automatic retry + attempt counter. Compare with the no-retry twin.' },
	{ to: '/playground/live', title: 'Polling', text: 'Live quotes revalidated every 2s while the route is active. Leave and polling stops.' },
	{ to: '/playground/actions', title: 'Actions + invalidation', text: 'Submit a form via useSubmitAction, list refreshes automatically. Manual refresh via invalidate().' },
	{ to: '/playground/blocker', title: 'Navigation blocking', text: 'Dirty form + useBlocker dialog. Try links and the browser Back button.' },
	{ to: '/playground/prefetch', title: 'Prefetch', text: 'Slow loader + hover prefetch: load instantly on click, loader runs exactly once.' },
	{ to: '/playground/optimistic', title: 'Optimistic navigation', text: 'Stale cached data renders instantly while fresh data revalidates in the background.' },
	{ to: '/playground/cache', title: 'Cache: eviction, gcTime, invalidate', text: 'LRU eviction with tiny maxCacheSize, gcTime cleanup and an invalidation lab with live results.' },
	{ to: '/playground/nest', title: 'Nested routes + params', text: 'Double-nested children with params at each level, random IDs, per-param loaders cached separately.' },
	{ to: '/playground/search', title: 'Search params', text: 'Filter via useSearchParams — single values and arrays, URL updates as you type.' },
	{ to: '/playground/guard', title: 'Route guards', text: 'beforeLoad checks with redirects — auth toggle as an example, origin passed via navigation state.' },
	{ to: '/playground/scroll', title: 'Scroll restoration', text: 'Window + named scroll containers (#feed, #gallery), smooth behavior. Scroll, leave, come back.' },
];

export const PlaygroundHome = () => (
	<div className="pg-wrap">
		<h1>Clear Router Playground</h1>
		<p>
			Live demo of data loading, cache and navigation features. Every card below is a working route — open devtools
			network tab and click around. Router settings (transitions, animation duration, cache size) can be tweaked
			live on the <Link to="/playground/settings">settings</Link> page.
		</p>
		<div className="pg-home-grid">
			{demos.map(d => (
				<Link key={d.to} to={d.to} className="pg-card-link">
					<div className="pg-card">
						<h2>{d.title}</h2>
						<p>{d.text}</p>
					</div>
				</Link>
			))}
		</div>
	</div>
);
