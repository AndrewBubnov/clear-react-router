import { type ComponentType, lazy, type ReactElement, Suspense } from 'react';

export const createLazyComponent = (
	importFn: () => Promise<{ default: ComponentType<unknown> }>,
	fallback?: ReactElement | (() => ReactElement)
): (() => ReactElement) => {
	const LazyComp = lazy(() => importFn().then(module => ({ default: module.default || module })));
	return () => (
		<Suspense fallback={typeof fallback === 'function' ? fallback() : fallback || null}>
			<LazyComp />
		</Suspense>
	);
};
