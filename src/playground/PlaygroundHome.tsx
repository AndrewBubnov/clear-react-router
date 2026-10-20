import { Fragment } from 'react';
import { Link } from './clear-router';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import type { NavLinkAs } from './NavLinkAs';
import { isMobileViewport } from './utils.ts';

const NAV_LINK_LABELS: Record<NavLinkAs, string> = {
	link: 'Link',
	mui: 'MUI',
	mantine: 'Mantine',
};

const SettingsSummary = () => {
	const s = usePlaygroundSettings();
	const rows: [string, string][] = [
		['Transitions', s.isAnimated ? 'on' : 'off'],
		['Animation', s.animationDuration ? `${s.animationDuration}ms` : 'default'],
		['Cache size', String(s.maxCacheSize)],
		['Prefetch', s.defaultPrefetch],
		['Nav link', NAV_LINK_LABELS[s.navLinkAs]],
		['Min loader', s.minLoaderDuration ? `${s.minLoaderDuration}ms` : 'unset'],
		['Status badge', s.showStatusBadge ? 'shown' : 'hidden'],
	];
	return (
		<dl className="pg-settings-grid">
			{rows.map(([label, value]) => (
				<Fragment key={label}>
					<dt>{label}</dt>
					<dd>{value}</dd>
				</Fragment>
			))}
		</dl>
	);
};

const demos = [
	{
		to: '/playground/settings',
		title: 'Settings',
		text: 'Router settings applied live: transitions, animation duration, cache size.',
	},
	{
		to: '/playground/cache',
		title: 'Cache: eviction, gcTime, invalidate',
		text: 'LRU eviction with tiny maxCacheSize, gcTime cleanup and an invalidation lab with live results.',
	},
	{
		to: '/playground/retry',
		title: 'Retry',
		text: 'Flaky loader (fails ~50%) with automatic retry + attempt counter. Compare with the no-retry twin.',
	},
	{
		to: '/playground/live',
		title: 'Polling',
		text: 'Live quotes revalidated every 2s while the route is active. Leave and polling stops.',
	},
	{
		to: '/playground/actions',
		title: 'Actions + invalidation',
		text: 'Submit a form via useSubmitAction, list refreshes automatically. Manual refresh via invalidate().',
	},
	{
		to: '/playground/blocker',
		title: 'Navigation blocking',
		text: 'Dirty form + useBlocker dialog. Try links and the browser Back button.',
	},
	{
		to: '/playground/optimistic',
		title: 'Optimistic navigation',
		text: 'Stale cached data renders instantly while fresh data revalidates in the background.',
	},
	{
		to: '/playground/prefetch',
		title: 'Prefetch',
		text: 'Slow loader + hover prefetch: load instantly on click, loader runs exactly once.',
	},
	{
		to: '/playground/nest',
		title: 'Nested routes + params',
		text: 'Double-nested children with params at each level, random IDs, per-param loaders cached separately, and a shared route layout that keeps its state across nested navigation.',
	},
	{
		to: '/playground/guard',
		title: 'Route guards',
		text: 'beforeLoad checks with redirects — auth toggle as an example, origin passed via navigation state.',
	},
	{
		to: '/playground/search',
		title: 'Search params',
		text: 'Filter via useSearchParams — single values and arrays, URL updates as you type.',
	},
	{
		to: '/playground/scroll',
		title: 'Scroll restoration',
		text: 'Window + named scroll containers (#feed, #gallery), smooth behavior. Scroll, leave, come back.',
	},
];

export const PlaygroundHome = () => (
	<div className="pg-wrap">
		<h1>Clear Router Playground</h1>
		<p>
			Live demo of data loading, cache and navigation features. Every card below is a working route — open
			devtools network tab and click around. Router settings (transitions, animation duration, cache size, etc.)
			can be tweaked live on the <Link to="/playground/settings">settings</Link> page.
		</p>
		{isMobileViewport && (
			<p className="pg-hint">
				You&apos;re browsing with a mobile viewport: menu links prefetch as soon as they appear (the{' '}
				<code>viewport</code> strategy), so loader counters may grow before you tap anything. The strategy can
				be switched live on the <Link to="/playground/settings">settings page</Link>.
			</p>
		)}
		<div className="pg-home-grid">
			{demos.map(d => (
				<Link key={d.to} to={d.to} className="pg-card-link">
					<div className="pg-card pg-card-home">
						<h2>{d.title}</h2>
						{d.to === '/playground/settings' ? <SettingsSummary /> : <p>{d.text}</p>}
					</div>
				</Link>
			))}
		</div>
	</div>
);
