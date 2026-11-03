import { useEffect, useRef, useState } from 'react';
import { Skeleton, Slider, Switch, Tooltip, Button } from '@mantine/core';
import { Link } from '../clear-router';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import type { PrefetchSetting } from './settings';
import type { NavLinkAs } from './NavLinkAs';

const PREFETCH_PRESETS: { value: PrefetchSetting; label: string }[] = [
	{ value: 'auto', label: 'auto' },
	{ value: 'hover', label: 'hover' },
	{ value: 'viewport', label: 'viewport' },
	{ value: 'render', label: 'render' },
	{ value: 'none', label: 'none' },
];

const NAV_LINK_PRESETS: { value: NavLinkAs; label: string }[] = [
	{ value: 'link', label: 'Link (plain <a> tag)' },
	{ value: 'mui', label: 'MUI Button' },
	{ value: 'mantine', label: 'Mantine Button' },
];

const SettingsLoader = ({ duration }: { duration: number | undefined }) => {
	const [isLoading, setIsLoading] = useState(false);
	const timeout = useRef<number | undefined>(undefined);
	useEffect(() => {
		window.clearTimeout(timeout.current);
		// Timer side effect, intentionally not derived state: the preview must restart on every change.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(true);
		timeout.current = window.setTimeout(() => setIsLoading(false), duration);
		return () => window.clearTimeout(timeout.current);
	}, [duration]);
	return isLoading ? <Skeleton height={22} width={90} radius="sm" /> : null;
};

const SettingsPage = () => {
	const {
		isAnimated,
		setIsAnimated,
		animationDuration,
		setAnimationDuration,
		maxCacheSize,
		setMaxCacheSize,
		showStatusBadge,
		setShowStatusBadge,
		defaultPrefetch,
		setDefaultPrefetch,
		minLoaderDuration,
		setMinLoaderDuration,
		navLinkAs,
		setNavLinkAs,
	} = usePlaygroundSettings();
	const [previewDuration, setPreviewDuration] = useState(minLoaderDuration);

	return (
		<div className="pg-wrap">
			<h1>Settings</h1>
			<div className="pg-settings-grid">
				<div className="pg-card">
					<h2>Page transitions</h2>
					<div className="pg-row pg-space-between">
						<Switch
							aria-label="animated transitions"
							checked={isAnimated}
							onChange={e => setIsAnimated(e.currentTarget.checked)}
						/>
						<div className="pg-inner-row">
							<Tooltip label="Enable animated transitions to use this slider" disabled={isAnimated}>
								<Slider
									min={100}
									max={2000}
									step={10}
									value={animationDuration ?? 500}
									disabled={!isAnimated}
									onChange={setAnimationDuration}
									label={v => `${v}ms`}
									labelAlwaysOn
									thumbLabel="Animation duration in milliseconds"
								/>
							</Tooltip>
							<Button onClick={() => setAnimationDuration(undefined)} disabled={!isAnimated} size="xs">
								Reset
							</Button>
						</div>
					</div>
					<p className="pg-hint">
						Switch on animated route transitions. The slider sets the duration for the next navigation;
						reset returns to the browser default.
					</p>
				</div>
				<div className="pg-card">
					<h2>Loader cache size</h2>
					<div className="pg-row">
						<Slider
							min={3}
							max={90}
							value={maxCacheSize}
							onChange={setMaxCacheSize}
							label={v => `${v}`}
							labelAlwaysOn
							thumbLabel="Maximum number of cached loader entries"
							style={{ width: '100%' }}
						/>
					</div>
					<p className="pg-hint">
						Lowering the limit evicts old entries gradually as new data loads — it does not purge the cache
						instantly.
					</p>
				</div>
				<div className="pg-card">
					<h2>Nav link element</h2>
					<div className="pg-row" role="radiogroup" aria-label="Nav link element">
						{NAV_LINK_PRESETS.map(preset => (
							<label key={preset.value} className="pg-radio">
								<input
									type="radio"
									name="nav-link-as"
									checked={navLinkAs === preset.value}
									onChange={() => setNavLinkAs(preset.value)}
								/>
								{preset.label}
							</label>
						))}
					</div>
					<p className="pg-hint">
						Renders every menu link through Link's <code>as</code> prop: a plain <code>&lt;a&gt;</code>, a
						real MUI <code>Button</code>, or a real Mantine <code>Button</code>. The router drives the same
						navigation, active and pending states in all three.
					</p>
				</div>
				<div className="pg-card">
					<h2>Link prefetch strategy</h2>
					<div className="pg-row" role="radiogroup" aria-label="Link prefetch strategy">
						{PREFETCH_PRESETS.map(preset => (
							<label key={preset.value} className="pg-radio">
								<input
									type="radio"
									name="prefetch-strategy"
									checked={defaultPrefetch === preset.value}
									onChange={() => setDefaultPrefetch(preset.value)}
								/>
								{preset.label}
							</label>
						))}
					</div>
					<p className="pg-hint">
						Auto follows the device: <code>viewport</code> on mobile (links prefetch as soon as they mount),{' '}
						<code>hover</code> on desktop. Applies to menu links live — routes with an explicit{' '}
						<code>prefetch</code> prop (like the lab links) are unaffected.
					</p>
				</div>
				<div className="pg-card">
					<h2>Min loader duration</h2>
					<div className="pg-row pg-skeleton-viz-wrap">
						<Slider
							min={0}
							max={3000}
							step={50}
							value={minLoaderDuration ?? 0}
							onChange={setMinLoaderDuration}
							onChangeEnd={setPreviewDuration}
							label={v => `${v} ms`}
							labelAlwaysOn
							thumbLabel="Min loader duration in milliseconds"
							style={{ width: '90%' }}
						/>
						<SettingsLoader duration={previewDuration} />
					</div>
					<p className="pg-hint">
						Without it, a fast loader flashes its fallback for a split second — visible flicker on every
						navigation. This setting holds the loading state for at least the given time, so the fallback
						never blinks. Try a high value and navigate to a fast route: the skeleton above previews the
						delay.
					</p>
				</div>
				<div className="pg-card">
					<h2>Show status badge</h2>
					<div className="pg-row">
						<Switch
							label="show badge"
							checked={showStatusBadge}
							onChange={e => setShowStatusBadge(e.currentTarget.checked)}
						/>
					</div>
					<p className="pg-hint">
						Shows the current route status in the header badge: idle, pending, active, optimistic, or error.
					</p>
				</div>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default SettingsPage;
