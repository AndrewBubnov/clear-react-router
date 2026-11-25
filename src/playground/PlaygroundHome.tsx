import { ForwardRefExoticComponent, RefAttributes, useRef } from 'react';

import {
	ActivityIcon,
	ArrowUpRightIcon,
	DatabaseIcon,
	HistoryIcon,
	ListChecksIcon,
	LockIcon,
	NetworkIcon,
	PlugZapIcon,
	RefreshCwIcon,
	RouteIcon,
	SearchIcon,
	ShieldCheckIcon,
	ZapIcon,
} from '@animateicons/react/lucide';
import { Link, useRouteStatus } from '../clear-router';
import { isMobileViewport } from './utils';

type Tone = 'indigo' | 'cyan' | 'rose' | 'amber' | 'violet' | 'teal';
type AnimatedIconHandle = {
	startAnimation: () => void;
	stopAnimation: () => void;
};

/** Animated icons from @animateicons/react: animate on hover (of the icon box)
 * and can be driven programmatically via `isAnimated`/the imperative handle. */
type AnimatedIconComponent = ForwardRefExoticComponent<
	{
		size?: number;
		color?: string;
		isAnimated?: boolean;
		duration?: number;
	} & RefAttributes<AnimatedIconHandle>
>;

type Demo = {
	to: string;
	title: string;
	text: string;
	icon: AnimatedIconComponent;
	tone: Tone;
};

const demos: Demo[] = [
	{
		to: '/playground/cache',
		title: 'Cache: eviction, gcTime, invalidate',
		text: 'LRU eviction with tiny maxCacheSize, gcTime cleanup and an invalidation lab with live results.',
		icon: DatabaseIcon,
		tone: 'indigo',
	},
	{
		to: '/playground/retry',
		title: 'Retry',
		text: 'Flaky loader (fails ~50%) with automatic retry + attempt counter. Compare with the no-retry twin.',
		icon: RefreshCwIcon,
		tone: 'cyan',
	},
	{
		to: '/playground/live',
		title: 'Polling',
		text: 'Live quotes revalidated every 2s while the route is active. Leave and polling stops.',
		icon: ActivityIcon,
		tone: 'rose',
	},
	{
		to: '/playground/actions',
		title: 'Actions + invalidation',
		text: 'Submit a form via useSubmitAction, list refreshes automatically. Manual refresh via invalidate().',
		icon: ListChecksIcon,
		tone: 'amber',
	},
	{
		to: '/playground/blocker',
		title: 'Navigation blocking',
		text: 'Dirty form + useBlocker dialog. Try links and the browser Back button.',
		icon: LockIcon,
		tone: 'violet',
	},
	{
		to: '/playground/optimistic',
		title: 'Optimistic navigation',
		text: 'Stale cached data renders instantly while fresh data revalidates in the background.',
		icon: ZapIcon,
		tone: 'teal',
	},
	{
		to: '/playground/cache/external/CLR',
		title: 'External data cache',
		text: 'Loaders delegate storage to TanStack Query: a route snapshot on navigation, a live subscription to the same fact key — and you invalidate facts, not URLs.',
		icon: PlugZapIcon,
		tone: 'rose',
	},
	{
		to: '/playground/prefetch',
		title: 'Prefetch',
		text: 'Slow loader + hover prefetch: load instantly on click, loader runs exactly once.',
		icon: RouteIcon,
		tone: 'indigo',
	},
	{
		to: '/playground/nest',
		title: 'Nested routes + params + layouts',
		text: 'Double-nested children with params at each level, random IDs, per-param loaders cached separately, and a shared route layout that keeps its state across nested navigation.',
		icon: NetworkIcon,
		tone: 'teal',
	},
	{
		to: '/playground/guard',
		title: 'Route guards',
		text: 'beforeLoad checks with redirects — auth toggle as an example, origin passed via navigation state.',
		icon: ShieldCheckIcon,
		tone: 'amber',
	},
	{
		to: '/playground/search',
		title: 'Data table',
		text: 'TanStack Table over loader data: multi-brand checkboxes, sort and pagination all live in the URL — keepPreviousData holds the rows.',
		icon: SearchIcon,
		tone: 'cyan',
	},
	{
		to: '/playground/scroll',
		title: 'Scroll restoration',
		text: 'Window + named scroll containers (#feed, #gallery), smooth behavior. Scroll, leave, come back.',
		icon: HistoryIcon,
		tone: 'violet',
	},
];

const pipeline = [
	{ label: 'navigate', meta: 'Link click', state: 'done', icon: RouteIcon },
	{ label: 'beforeLoad', meta: 'guards', state: 'done', icon: ShieldCheckIcon },
	{ label: 'loader', meta: 'cache hit', state: 'hit', icon: DatabaseIcon },
	{ label: 'render', meta: 'optimistic', state: 'fast', icon: ZapIcon },
];

const DemoCard = ({ demo, index }: { demo: Demo; index: number }) => {
	const iconRef = useRef<AnimatedIconHandle>(null);
	const status = useRouteStatus();
	return (
		<Link
			to={demo.to}
			className="pg-card-link"
			style={{ animationDelay: `${index * 45}ms` }}
			onMouseEnter={() => iconRef.current?.startAnimation()}
			onMouseLeave={() => iconRef.current?.stopAnimation()}
		>
			<div className="pg-card pg-card-home" data-tone={demo.tone}>
				<span className="pg-card-icon pg-anim-icon-inline">
					<demo.icon
						ref={iconRef}
						size={21}
						isAnimated={status === 'pending'}
						duration={1}
						aria-hidden="true"
					/>
				</span>
				<h3>{demo.title}</h3>
				<p>{demo.text}</p>
				<span className="pg-card-arrow">
					<ArrowUpRightIcon size={18} aria-hidden="true" />
				</span>
			</div>
		</Link>
	);
};

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
			</div>
			<div className="pg-hero__visual" aria-hidden="true">
				<div className="pg-visual-glow" />
				<div className="pg-window">
					<div className="pg-window__bar">
						<span className="pg-window__dot" />
						<span className="pg-window__dot" />
						<span className="pg-window__dot" />
						<span className="pg-window__url">/playground/nest/42/item/7</span>
					</div>
					<div className="pg-pipeline">
						{pipeline.map(step => {
							const Icon = step.icon;
							return (
								<div className="pg-pipeline__step" key={step.label}>
									<span className="pg-pipeline__icon">
										<Icon size={17} />
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
							<DatabaseIcon size={13} />3 cached entries
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
		<section className="pg-demos" id="demos" aria-label="Demos">
			<div className="pg-home-grid">
				{demos.map((demo, index) => (
					<DemoCard key={demo.to} demo={demo} index={index} />
				))}
			</div>
		</section>
	</div>
);
