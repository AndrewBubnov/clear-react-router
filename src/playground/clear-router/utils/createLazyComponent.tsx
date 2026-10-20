import { type ComponentType, lazy, type ReactElement, Suspense } from 'react';

export const createLazyComponent = (importFn: () => Promise<{ default: unknown }>, fallback?: unknown) => {
	const load = () => importFn().then(module => ({ default: (module.default || module) as ComponentType<unknown> }));
	const LazyComp = lazy(load);
	const Component = () => (
		<Suspense
			fallback={typeof fallback === 'function' ? (fallback as () => ReactElement)() : (fallback as ReactElement) || null}
		>
			<LazyComp />
		</Suspense>
	);
	return { Component, preloadElement: load };
};
