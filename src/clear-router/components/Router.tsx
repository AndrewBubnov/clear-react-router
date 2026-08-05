import { PropsWithChildren } from 'react';
import { router } from '../instance';
import { useNavigation } from '../hooks/useNavigation';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig';
import { useSetInitialContext } from '../hooks/useSetInitialContext';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types';

const EmptyBoundary = ({ children }: PropsWithChildren) => children;
let r = 0;
export const Router = ({
	routes,
	beforeLoad,
	afterLoad,
	animationDuration,
	isAnimated = false,
	spinner = true,
	defaultPreserveScroll = true,
	showFallbackOnAnimation = false,
	prefetch = 'hover',
	hoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
	errorBoundary: ErrorBoundary = EmptyBoundary,
	context: initialContext,
	defaultLoaderFallback,
	defaultErrorElement,
	defaultRetry,
	defaultStaleTime,
}: RouterProps) => {
	const { useIsLoading, useRouteItemData } = router.hooks;
	const [isLoading] = useIsLoading();
	const [routeItemData] = useRouteItemData();
	const pendingState = router.state.pendingState.value;
	const loaderState = router.state.loaderStateRef.value;
	r++;
	console.log(r);
	useNavigation();

	useSetRouterConfig({
		routes,
		isAnimated,
		prefetch,
		hoverPrefetchDelay,
		beforeLoad,
		afterLoad,
		defaultRetry,
		defaultStaleTime,
		defaultPreserveScroll,
	});
	useApplyCustomAnimation(animationDuration);
	useSetInitialContext(initialContext);
	usePreserveScroll(routeItemData);

	const { routeItem, location } = routeItemData;

	const showErrorElement = !isLoading && Boolean(loaderState.loaderError || loaderState.beforeLoadError);

	const showSpinner = spinner && isAnimated && isLoading;
	const loadingContent = !showErrorElement && isLoading;

	if ((showFallbackOnAnimation || !isAnimated) && loadingContent) {
		return renderElement(pendingState?.routeItem?.loaderFallback || defaultLoaderFallback);
	}

	if (!showFallbackOnAnimation && isAnimated && loadingContent) return <Spinner />;

	if (!routeItem) return null;

	if (showErrorElement) {
		return (
			<>
				{renderElement(routeItem.errorElement || defaultErrorElement)}
				{showSpinner && <Spinner />}
			</>
		);
	}

	return (
		<div style={{ viewTransitionName: 'page' }}>
			<ErrorBoundary key={location.pathname}>{renderElement(routeItem.element)}</ErrorBoundary>
			{showSpinner && <Spinner />}
		</div>
	);
};
