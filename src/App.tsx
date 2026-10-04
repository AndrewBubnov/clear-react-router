import { Router, useRouteStatus } from './clear-router';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import { PlaygroundSettingsProvider } from './playground/settings';
import { usePlaygroundSettings } from './playground/usePlaygroundSettings';
import './playground/playground.css';

const Shell = () => {
	const { isAnimated, animationDuration, maxCacheSize, defaultPrefetch } = usePlaygroundSettings();
	return (
		<div>
			{/* Remount on strategy change: Link's viewport/render effects attach at mount time only. */}
			<PlaygroundNav key={defaultPrefetch} />
			<Router
				routes={playgroundRoutes}
				isAnimated={isAnimated}
				animationDuration={animationDuration}
				maxCacheSize={maxCacheSize}
				defaultPrefetch={defaultPrefetch === 'auto' ? undefined : defaultPrefetch}
			/>
		</div>
	);
};

const STATUS_BADGE_MODIFIER: Record<string, string> = {
	error: 'status-badge-error',
	optimistic: 'status-badge-optimistic',
};

const Status = () => {
	const status = useRouteStatus();
	const { showStatusBadge } = usePlaygroundSettings();
	if (!showStatusBadge) return null;
	return <div className={`status-badge ${STATUS_BADGE_MODIFIER[status] ?? ''}`}>{status}</div>;
};

const App = () => {
	return (
		<PlaygroundSettingsProvider>
			<Shell />
			<Status />
		</PlaygroundSettingsProvider>
	);
};

export default App;
