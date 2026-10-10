import { useEffect, useRef, useState } from 'react';
import { Link } from '../clear-router';
import { usePlaygroundSettings } from './usePlaygroundSettings';
import { Switch } from './Switch';
import type { PrefetchSetting } from './settings';

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
	return isLoading ? (
		<span className="loader" style={{ width: 24, height: 24, marginLeft: 50 }} />
	) : (
		<div style={{ width: 24, height: 24 }} />
	);
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
	} = usePlaygroundSettings();

	return (
		<div className="pg-wrap">
			<h1>Settings</h1>
			<p className="pg-hint">
				Playground-wide router settings. Changes apply live, without reload — the same state drives the menu
				switch above.
			</p>
			<div className="pg-card">
				<h2>Page transitions</h2>
				<div className="pg-row">
					<Switch checked={isAnimated} onCheckedChange={setIsAnimated}>
						<span>animated transitions</span>
					</Switch>
				</div>
				<div className="pg-row">
					<input
						type="range"
						className="pg-range"
						min={100}
						max={2000}
						step={50}
						value={animationDuration ?? 500}
						disabled={!isAnimated}
						onChange={e => setAnimationDuration(Number(e.target.value))}
						aria-label="Animation duration in milliseconds"
					/>
					<span className="pg-label-string">{`${animationDuration ? animationDuration : 500}ms`}</span>
					<button className="pg-btn" onClick={() => setAnimationDuration(undefined)}>
						Reset to browser default
					</button>
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
			<div className="pg-card pg-card-short">
				<h2>Min loader duration</h2>
				<div className="pg-row">
					<input
						type="range"
						className="pg-range"
						min={0}
						max={2000}
						step={50}
						value={minLoaderDuration}
						onChange={e => setMinLoaderDuration(Number(e.target.value))}
						aria-label="Min loader duration in milliseconds"
					/>
					<span className="pg-label-string">{`${minLoaderDuration ? minLoaderDuration : 'unset'}${minLoaderDuration ? 'ms' : ''}`}</span>
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
					<Switch checked={showStatusBadge} onCheckedChange={setShowStatusBadge}>
						<span>show badge</span>
					</Switch>
				</div>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default SettingsPage;
