import { useEffect, useRef, useState } from 'react';
import { Loader, Slider, Switch, Tooltip, Button } from '@mantine/core';
import { Link } from './clear-router';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import type { PrefetchSetting } from './settings';
import type { NavLinkAs } from './NavLinkAs';

const CACHE_PRESETS = [
	{ value: 3, label: '3 (lab)' },
	{ value: 60, label: '60 (mobile default)' },
	{ value: 150, label: '150 (desktop default)' },
];

const PREFETCH_PRESETS: { value: PrefetchSetting; label: string }[] = [
	{ value: 'auto', label: 'auto (device default)' },
	{ value: 'hover', label: 'hover' },
	{ value: 'viewport', label: 'viewport' },
	{ value: 'render', label: 'render' },
	{ value: 'none', label: 'none' },
];

const NAV_LINK_PRESETS: { value: NavLinkAs; label: string }[] = [
	{ value: 'link', label: 'Link (plain <a>)' },
	{ value: 'mui', label: 'MUI Button' },
	{ value: 'mantine', label: 'Mantine Button' },
];

const SettingsLoader = ({ duration }: { duration: number | undefined }) => {
	const [isLoading, setIsLoading] = useState(false);
	const timeout = useRef<number | undefined>(undefined);
	useEffect(() => {
		window.clearTimeout(timeout.current);
		// Timer side effect, intentionally not derived state: the spinner must restart on every change.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setIsLoading(true);
		timeout.current = window.setTimeout(() => setIsLoading(false), duration);
		return () => window.clearTimeout(timeout.current);
	}, [duration]);
	return isLoading ? <Loader size="sm" /> : null;
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

	return (
		<div className="pg-wrap">
			<h1>Settings</h1>
			<p className="pg-hint">
				Playground-wide router settings. Changes apply live, without reload.
			</p>
			<div className="pg-card">
				<h2>Page transitions</h2>
				<div className="pg-row">
					<Switch
						label="animated transitions"
						checked={isAnimated}
						onChange={e => setIsAnimated(e.currentTarget.checked)}
					/>
				</div>
				<div className="pg-row">
					<Tooltip label="Enable animated transitions to use this slider" disabled={isAnimated}>
						<div className="pg-slider">
							<Slider
								min={100}
								max={2000}
								step={50}
								value={animationDuration ?? 500}
								disabled={!isAnimated}
								onChange={setAnimationDuration}
								label={v => `${v}ms`}
								labelAlwaysOn
								thumbLabel="Animation duration in milliseconds"
							/>
						</div>
					</Tooltip>
					<Button onClick={() => setAnimationDuration(undefined)} disabled={!isAnimated} variant="light">
						Reset to browser default
					</Button>
				</div>
			</div>
			<div className="pg-card">
				<h2>Loader cache size</h2>
				<div className="pg-row" role="radiogroup" aria-label="Loader cache size">
					{CACHE_PRESETS.map(preset => (
						<label key={preset.value} className="pg-radio">
							<input
								type="radio"
								name="cache-size"
								checked={maxCacheSize === preset.value}
								onChange={() => setMaxCacheSize(preset.value)}
							/>
							{preset.label}
						</label>
					))}
				</div>
				<p className="pg-hint">
					Lowering the limit evicts old entries gradually as new data loads — it does not purge the cache
					instantly. Current value: <span className="pg-badge">{maxCacheSize}</span>
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
					Renders every menu link through Link's <code>as</code> prop: a plain <code>&lt;a&gt;</code>, a real
					MUI <code>Button</code>, or a real Mantine <code>Button</code>. The router drives the same
					navigation, active and pending states in all three.
				</p>
			</div>
			<div className="pg-card pg-card-short">
				<h2>Min loader duration</h2>
				<div className="pg-row pg-settings-loader-wrap">
					<div className="pg-row">
						<div className="pg-slider">
							<Slider
								min={0}
								max={2000}
								step={50}
								value={minLoaderDuration ?? 0}
								onChange={setMinLoaderDuration}
								label={v => (v ? `${v}ms` : 'unset')}
								labelAlwaysOn
								thumbLabel="Min loader duration in milliseconds"
							/>
						</div>
					</div>
					<SettingsLoader duration={minLoaderDuration} />
				</div>
				<p className="pg-hint">
					Without it, a fast loader flashes its fallback for a split second — visible flicker on every
					navigation. This setting holds the loading state for at least the given time, so the fallback never
					blinks. Try a high value and navigate to a fast route: the spinner above previews the delay.
				</p>
			</div>
			<div className="pg-card pg-card-short">
				<h2>Show status badge</h2>
				<div className="pg-row">
					<Switch
						label="show badge"
						checked={showStatusBadge}
						onChange={e => setShowStatusBadge(e.currentTarget.checked)}
					/>
				</div>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default SettingsPage;
