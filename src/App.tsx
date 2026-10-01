import { Router } from './clear-router';
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

const App = () => (
	<PlaygroundSettingsProvider>
		<Shell />
	</PlaygroundSettingsProvider>
);

export default App;
