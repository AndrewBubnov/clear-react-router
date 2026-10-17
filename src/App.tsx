import { Badge, MantineProvider } from '@mantine/core';
import { Router, useRouteStatus, type Status as RouteStatus } from './clear-router';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import { PlaygroundSettingsProvider } from './playground/settings';
import { usePlaygroundSettings } from './playground/usePlaygroundSettings';
import './playground/playground.css';

const Shell = () => {
	const { isAnimated, animationDuration, maxCacheSize, defaultPrefetch, minLoaderDuration } = usePlaygroundSettings();
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
				defaultMinLoaderDuration={minLoaderDuration}
			/>
		</div>
	);
};

const STATUS_COLOR: Record<RouteStatus, string> = {
	idle: 'gray',
	pending: 'blue',
	active: 'teal',
	optimistic: 'yellow',
	error: 'red',
};

const Status = () => {
	const status = useRouteStatus();
	const { showStatusBadge } = usePlaygroundSettings();
	if (!showStatusBadge) return null;
	return (
		<Badge className="status-badge" color={STATUS_COLOR[status]} size="lg" radius="xl">
			{status}
		</Badge>
	);
};

const App = () => {
	return (
		<MantineProvider>
			<PlaygroundSettingsProvider>
				<Shell />
				<Status />
			</PlaygroundSettingsProvider>
		</MantineProvider>
	);
};

export default App;
