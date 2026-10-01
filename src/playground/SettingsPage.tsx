import { Link } from '../clear-router';
import { usePlaygroundSettings } from './usePlaygroundSettings';

const CACHE_PRESETS = [
	{ value: 3, label: '3 (lab)' },
	{ value: 60, label: '60 (mobile default)' },
	{ value: 150, label: '150 (desktop default)' },
];

export const SettingsPage = () => {
	const { isAnimated, setIsAnimated, animationDuration, setAnimationDuration, maxCacheSize, setMaxCacheSize } =
		usePlaygroundSettings();

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
					<label className="pg-switch">
						<input
							type="checkbox"
							className="pg-checkbox"
							checked={isAnimated}
							onChange={e => setIsAnimated(e.target.checked)}
						/>
						animated transitions
					</label>
				</div>
				<div className="pg-row">
					<label>
						duration: <span className="pg-badge">{animationDuration ?? 'browser default'}</span>
					</label>
				</div>
				<div className="pg-row">
					<input
						type="range"
						className="pg-range"
						min={100}
						max={2000}
						step={50}
						value={animationDuration ?? 500}
						onChange={e => setAnimationDuration(Number(e.target.value))}
						aria-label="Animation duration in milliseconds"
					/>
					<button className="pg-btn" onClick={() => setAnimationDuration(undefined)}>
						Reset to browser default
					</button>
				</div>
			</div>
			<div className="pg-card">
				<h2>Loader cache size</h2>
				<div className="pg-row">
					{CACHE_PRESETS.map(preset => (
						<button
							key={preset.value}
							className="pg-btn"
							disabled={maxCacheSize === preset.value}
							onClick={() => setMaxCacheSize(preset.value)}
						>
							{preset.label}
						</button>
					))}
				</div>
				<p className="pg-hint">
					Lowering the limit evicts old entries gradually as new data loads — it does not purge the cache
					instantly. Current value: <span className="pg-badge">{maxCacheSize}</span>
				</p>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};
