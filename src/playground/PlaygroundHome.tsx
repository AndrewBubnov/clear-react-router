import type { TablerIcon } from '@tabler/icons-react';
import {
	IconActivity,
	IconArrowRight,
	IconArrowUpRight,
	IconBolt,
	IconChartDonut,
	IconDatabase,
	IconHistory,
	IconListCheck,
	IconLock,
	IconRefresh,
	IconRoute,
	IconSearch,
	IconSettings,
	IconShieldCheck,
	IconSitemap,
	IconStack2,
} from '@tabler/icons-react';
import { Link } from '../clear-router';
import { isMobileViewport } from './utils.ts';

type Tone = 'indigo' | 'cyan' | 'rose' | 'amber' | 'violet' | 'teal';

type Demo = {
	to: string;
	title: string;
	text: string;
	icon: TablerIcon;
	tone: Tone;
};

const demos: Demo[] = [
	{
		to: '/playground/cache',
		title: 'Cache: eviction, gcTime, invalidate',
		text: 'LRU eviction with tiny maxCacheSize, gcTime cleanup and an invalidation lab with live results.',
		icon: IconDatabase,
		tone: 'indigo',
	},
	{
		to: '/playground/retry',
		title: 'Retry',
		text: 'Flaky loader (fails ~50%) with automatic retry + attempt counter. Compare with the no-retry twin.',
		icon: IconRefresh,
		tone: 'cyan',
	},
	{
		to: '/playground/live',
		title: 'Polling',
		text: 'Live quotes revalidated every 2s while the route is active. Leave and polling stops.',
		icon: IconActivity,
		tone: 'rose',
	},
	{
		to: '/playground/actions',
		title: 'Actions + invalidation',
		text: 'Submit a form via useSubmitAction, list refreshes automatically. Manual refresh via invalidate().',
		icon: IconListCheck,
		tone: 'amber',
	},
	{
		to: '/playground/blocker',
		title: 'Navigation blocking',
		text: 'Dirty form + useBlocker dialog. Try links and the browser Back button.',
		icon: IconLock,
		tone: 'violet',
	},
	{
		to: '/playground/optimistic',
		title: 'Optimistic navigation',
		text: 'Stale cached data renders instantly while fresh data revalidates in the background.',
		icon: IconBolt,
		tone: 'teal',
	},
	{
		to: '/playground/deferred',
		title: 'Deferred render',
		text: 'The route shell renders fast; a slow promise inside loader data streams in a colored chart under its own Suspense fallback.',
		icon: IconChartDonut,
		tone: 'rose',
	},
	{
		to: '/playground/prefetch',
		title: 'Prefetch',
		text: 'Slow loader + hover prefetch: load instantly on click, loader runs exactly once.',
		icon: IconRoute,
		tone: 'indigo',
	},
	{
		to: '/playground/nest',
		title: 'Nested routes + params + layouts',
		text: 'Double-nested children with params at each level, random IDs, per-param loaders cached separately, and a shared route layout that keeps its state across nested navigation.',
		icon: IconSitemap,
		tone: 'teal',
	},
	{
		to: '/playground/guard',
		title: 'Route guards',
		text: 'beforeLoad checks with redirects — auth toggle as an example, origin passed via navigation state.',
		icon: IconShieldCheck,
		tone: 'amber',
	},
	{
		to: '/playground/search',
		title: 'Search params',
		text: 'Filter via useSearchParams — single values and arrays, URL updates as you type.',
		icon: IconSearch,
		tone: 'cyan',
	},
	{
		to: '/playground/scroll',
		title: 'Scroll restoration',
		text: 'Window + named scroll containers (#feed, #gallery), smooth behavior. Scroll, leave, come back.',
		icon: IconHistory,
		tone: 'violet',
	},
];

const pipeline = [
	{ label: 'navigate', meta: 'Link click', state: 'done', icon: IconRoute },
	{ label: 'beforeLoad', meta: 'guards', state: 'done', icon: IconShieldCheck },
	{ label: 'loader', meta: 'cache hit', state: 'hit', icon: IconDatabase },
	{ label: 'render', meta: 'optimistic', state: 'fast', icon: IconBolt },
];

export const PlaygroundHome = () => (
	<div className="pg-wrap pg-home">
		<section className="pg-hero">
			<div className="pg-hero__copy">
				<span className="pg-eyebrow">Clear React Router</span>
				<h1>Clear Router Playground</h1>
				<p className="pg-hero__lead">
					Live demos of data loading, cache and navigation. Every card is a working route — open the{' '}
					<strong>network tab</strong> and click around.
				</p>
				<div className="pg-hero__actions">
					<a
						className="pg-button pg-button--primary"
						href="#demos"
						onClick={event => {
							event.preventDefault();
							document.getElementById('demos')?.scrollIntoView({
								behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
									? 'auto'
									: 'smooth',
							});
						}}
					>
						Explore 12 demos
						<IconArrowRight size={17} stroke={2} aria-hidden="true" />
					</a>
					<Link className="pg-button pg-button--ghost" to="/playground/settings">
						<IconSettings size={17} stroke={1.8} aria-hidden="true" />
						Settings
					</Link>
				</div>
				<div className="pg-hero__facts">
					<span>
						<IconRoute size={15} stroke={1.8} aria-hidden="true" />
						Nested routes
					</span>
					<span>
						<IconStack2 size={15} stroke={1.8} aria-hidden="true" />
						Loader cache
					</span>
					<span>
						<IconBolt size={15} stroke={1.8} aria-hidden="true" />
						Optimistic UI
					</span>
				</div>
			</div>
			<div className="pg-hero__visual" aria-hidden="true">
				<div className="pg-visual-glow" />
				<div className="pg-window">
					<div className="pg-window__bar">
						<span className="pg-window__dot" />
						<span className="pg-window__dot" />
						<span className="pg-window__dot" />
						<span className="pg-window__url">/playground/nest/42/item/7</span>
						<span className="pg-window__live">live</span>
					</div>
					<div className="pg-pipeline">
						{pipeline.map(step => {
							const Icon = step.icon;
							return (
								<div className="pg-pipeline__step" key={step.label}>
									<span className="pg-pipeline__icon">
										<Icon size={17} stroke={1.8} />
									</span>
									<span className="pg-pipeline__copy">
										<strong>{step.label}</strong>
										<span>{step.meta}</span>
									</span>
									<span className="pg-pipeline__state" data-state={step.state}>
										{step.state}
									</span>
								</div>
							);
						})}
					</div>
					<div className="pg-window__footer">
						<span>
							<IconDatabase size={13} stroke={1.8} />3 cached entries
						</span>
						<span>42 ms</span>
					</div>
				</div>
			</div>
		</section>
		{isMobileViewport && (
			<p className="pg-hint">
				You&apos;re browsing with a mobile viewport: menu links prefetch as soon as they appear (the{' '}
				<code>viewport</code> strategy), so loader counters may grow before you tap anything. The strategy can
				be switched live on the <Link to="/playground/settings">settings page</Link>.
			</p>
		)}
		<section className="pg-demos" id="demos" aria-labelledby="demos-title">
			<div className="pg-section-head">
				<div>
					<span className="pg-eyebrow">Explore the routes</span>
					<h2 id="demos-title">Twelve demos, one router</h2>
				</div>
				<span className="pg-count">12 live demos</span>
			</div>
			<div className="pg-home-grid">
				{demos.map((demo, index) => {
					const Icon = demo.icon;
					return (
						<Link
							key={demo.to}
							to={demo.to}
							className="pg-card-link"
							style={{ animationDelay: `${index * 45}ms` }}
						>
							<div className="pg-card pg-card-home" data-tone={demo.tone}>
								<span className="pg-card-icon">
									<Icon size={21} stroke={1.7} aria-hidden="true" />
								</span>
								<h3>{demo.title}</h3>
								<p>{demo.text}</p>
								<span className="pg-card-arrow">
									<IconArrowUpRight size={18} stroke={1.8} aria-hidden="true" />
								</span>
							</div>
						</Link>
					);
				})}
			</div>
		</section>
	</div>
);
