import { Router, useRouteStatus } from './clear-router';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import { PlaygroundSettingsProvider } from './playground/settings';
import { usePlaygroundSettings } from './playground/usePlaygroundSettings';
import './playground/playground.css';

const Shell = () => {
	const { isAnimated, animationDuration, maxCacheSize } = usePlaygroundSettings();
	return (
		<div>
			<PlaygroundNav />
			<Router
				routes={playgroundRoutes}
				isAnimated={isAnimated}
				animationDuration={animationDuration}
				maxCacheSize={maxCacheSize}
			/>
		</div>
	);
};

const Status = () => {
	const status = useRouteStatus();
	const { showStatusBadge } = usePlaygroundSettings();
	if (!showStatusBadge) return null;
	return (
		<div className="status-badge">
			<div className="status-badge-text">{status}</div>
		</div>
	);
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
