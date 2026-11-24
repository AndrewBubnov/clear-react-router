import { lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { MantineProvider, type MantineTheme } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Router, useCacheSnapshot, useRouteStatus } from './clear-router';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import { PlaygroundSettingsProvider } from './playground/settings';
import { usePlaygroundSettings } from './playground/usePlaygroundSettings';
import { theme } from './playground/theme';
import './playground/playground.css';

// Mantine-powered UI: loaded only when the visualizer is switched on.
const CacheVisualizer = lazy(() => import('./playground/CacheVisualizer'));

const CacheVizSlot = ({ maxSlots }: { maxSlots: number }) => {
	const entries = useCacheSnapshot();
	const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const visible = entries.some(entry => entry.isCached);
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
									stiffness: 280,
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
					<Suspense fallback={null}>
						<CacheVisualizer maxSlots={maxSlots} />
					</Suspense>
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
					context={{ queryClient }}
				/>
			</main>
		</div>
	);
};

const Status = () => {
	const status = useRouteStatus();
	const { showStatusBadge } = usePlaygroundSettings();
	if (!showStatusBadge) return null;
	return <span className={`status-badge pg-status-${status}`}>{status}</span>;
};

const cssVariablesResolver = (t: MantineTheme) => ({
	variables: {},
	light: {},
	// Mantine's light variant paints text with shade 0 (near-white) in dark mode; use the mid shade instead.
	dark: { '--mantine-color-brand-light-color': t.colors.brand[3] },
});

const queryClient = new QueryClient();

// Dev bridge for e2e: lets specs inspect/invalidate facts between hover and click.
if (import.meta.env.DEV) {
	(window as unknown as { __queryClient?: QueryClient }).__queryClient = queryClient;
}

const App = () => {
	return (
		<MantineProvider theme={theme} defaultColorScheme="auto" cssVariablesResolver={cssVariablesResolver}>
			<QueryClientProvider client={queryClient}>
				<PlaygroundSettingsProvider>
					<Shell />
					<Status />
				</PlaygroundSettingsProvider>
			</QueryClientProvider>
		</MantineProvider>
	);
};

export default App;
