import { AnimatePresence, motion } from 'motion/react';
import { Badge, MantineProvider, createTheme, type MantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Router, useRouteStatus, type Status as RouteStatus } from './clear-router';
import { CacheVisualizer } from './playground/CacheVisualizer';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import { PlaygroundSettingsProvider } from './playground/settings';
import { usePlaygroundSettings } from './playground/usePlaygroundSettings';
import './playground/playground.css';

const Shell = () => {
	const { isAnimated, animationDuration, maxCacheSize, defaultPrefetch, minLoaderDuration, showCacheVisualizer } =
		usePlaygroundSettings();
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	return (
		<div>
			{/* Remount on strategy change: Link's viewport/render effects attach at mount time only. */}
			<PlaygroundNav key={defaultPrefetch} />
			<div className="pg-content">
				<AnimatePresence initial={false}>
					{showCacheVisualizer && (
						<motion.div
							className="pg-cache-viz"
							initial={{ height: 0, marginTop: 0 }}
							animate={{
								height: 'auto',
								marginTop: 20,
								transition: reduceMotion
									? { duration: 0 }
									: {
											type: 'spring',
											stiffness: 400,
											damping: 28,
											mass: 0.8,
										},
							}}
							exit={{
								height: 0,
								marginTop: 0,
								transition: reduceMotion ? { duration: 0 } : { duration: 0.22, ease: 'easeIn' },
							}}
						>
							<CacheVisualizer maxSlots={maxCacheSize} />
						</motion.div>
					)}
				</AnimatePresence>
				<Router
					routes={playgroundRoutes}
					isAnimated={isAnimated}
					animationDuration={animationDuration}
					maxCacheSize={maxCacheSize}
					defaultPrefetch={defaultPrefetch === 'auto' ? undefined : defaultPrefetch}
					defaultMinLoaderDuration={minLoaderDuration}
					logged={showCacheVisualizer}
				/>
			</div>
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

const theme = createTheme({
	primaryColor: 'steelblue',
	colors: {
		steelblue: [
			'#f0f5f9',
			'#c7dbec',
			'#abc8e3',
			'#98bbd7',
			'#73a2c9',
			'#5a91bf',
			'#4682b4',
			'#3c709a',
			'#336084',
			'#294d6a',
		],
	},
});

const cssVariablesResolver = (t: MantineTheme) => ({
	variables: {},
	light: {},
	// Mantine's light variant paints text with shade 0 (near-white) in dark mode; use the mid shade instead.
	dark: { '--mantine-color-steelblue-light-color': t.colors.steelblue[4] },
});

const App = () => {
	return (
		<MantineProvider theme={theme} defaultColorScheme="auto" cssVariablesResolver={cssVariablesResolver}>
			<PlaygroundSettingsProvider>
				<Shell />
				<Status />
			</PlaygroundSettingsProvider>
		</MantineProvider>
	);
};

export default App;
