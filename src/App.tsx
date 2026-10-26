import { AnimatePresence, motion } from 'motion/react';
import { Badge, MantineProvider, createTheme, type MantineTheme } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Router, useCacheSnapshot, useRouteStatus, type Status as RouteStatus } from './clear-router';
import { CacheVisualizer } from './playground/CacheVisualizer';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import { PlaygroundSettingsProvider } from './playground/settings';
import { usePlaygroundSettings } from './playground/usePlaygroundSettings';
import './playground/playground.css';

const RouteProgress = () => {
	const status = useRouteStatus();
	const busy = status === 'pending' || status === 'optimistic';
	return <div className={`pg-route-progress${busy ? ' is-active' : ''}`} aria-hidden="true" />;
};

const CacheVizSlot = ({ maxSlots }: { maxSlots: number }) => {
	const entries = useCacheSnapshot();
	const reduceMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	const visible = entries.some(entry => !entry.isLoading);
	return (
		<AnimatePresence initial={false}>
			{visible && (
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
					<CacheVisualizer maxSlots={maxSlots} />
				</motion.div>
			)}
		</AnimatePresence>
	);
};

const Shell = () => {
	const { isAnimated, animationDuration, maxCacheSize, defaultPrefetch, minLoaderDuration, showCacheVisualizer } =
		usePlaygroundSettings();
	return (
		<div className="pg-app">
			<RouteProgress />
			{/* Remount on strategy change: Link's viewport/render effects attach at mount time only. */}
			<PlaygroundNav key={defaultPrefetch} />
			<main className="pg-content">
				{showCacheVisualizer && <CacheVizSlot maxSlots={maxCacheSize} />}
				<Router
					routes={playgroundRoutes}
					isAnimated={isAnimated}
					animationDuration={animationDuration}
					maxCacheSize={maxCacheSize}
					defaultPrefetch={defaultPrefetch === 'auto' ? undefined : defaultPrefetch}
					defaultMinLoaderDuration={minLoaderDuration}
					enableCacheSnapshot={showCacheVisualizer}
				/>
			</main>
		</div>
	);
};

const STATUS_COLOR: Record<RouteStatus, string> = {
	idle: 'gray',
	pending: 'indigo',
	active: 'teal',
	optimistic: 'yellow',
	error: 'red',
};

const Status = () => {
	const status = useRouteStatus();
	const { showStatusBadge } = usePlaygroundSettings();
	if (!showStatusBadge) return null;
	return (
		<Badge className="status-badge" color={STATUS_COLOR[status]} variant="light" size="sm" radius="xl" tt="none">
			{status}
		</Badge>
	);
};

const theme = createTheme({
	primaryColor: 'brand',
	primaryShade: { light: 6, dark: 4 },
	fontFamily: "'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
	fontFamilyMonospace: "'Geist Mono Variable', ui-monospace, 'Cascadia Code', Consolas, monospace",
	headings: {
		fontFamily: "'Geist Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
		fontWeight: '640',
	},
	defaultRadius: 'lg',
	colors: {
		brand: [
			'#eef2ff',
			'#e0e7ff',
			'#c7d2fe',
			'#a5b4fc',
			'#818cf8',
			'#6366f1',
			'#4f46e5',
			'#4338ca',
			'#3730a3',
			'#312e81',
		],
	},
});

const cssVariablesResolver = (t: MantineTheme) => ({
	variables: {},
	light: {},
	// Mantine's light variant paints text with shade 0 (near-white) in dark mode; use the mid shade instead.
	dark: { '--mantine-color-brand-light-color': t.colors.brand[3] },
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
