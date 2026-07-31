import { type ComponentType, lazy, type ReactElement, Suspense } from 'react';

export const createLazyComponent = (
	importFn: () => Promise<{ default: ComponentType<unknown> }>,
	fallback?: ReactElement | (() => ReactElement)
) => {
	const load = () => importFn().then(module => ({ default: module.default || module }));
	const LazyComp = lazy(load);
	const Component = () => (
		<Suspense fallback={typeof fallback === 'function' ? fallback() : fallback || null}>
			<LazyComp />
		</Suspense>
	);
	return { Component, preloadElement: load };
};
