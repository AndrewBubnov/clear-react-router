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
import { isMobile } from '../utils/utils.ts';

const EmptyBoundary = ({ children }: PropsWithChildren) => children;

export const Router = ({
	routes,
	defaultBeforeLoad,
	defaultAfterLoad,
	animationDuration,
	isAnimated = false,
	spinner = true,
	defaultPreserveScroll = true,
	showFallbackOnAnimation = false,
	defaultPrefetch = isMobile() ? 'viewport' : 'hover',
	defaultHoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
	errorBoundary: ErrorBoundary = EmptyBoundary,
	context: initialContext,
	defaultLoaderFallback,
	defaultErrorElement,
	defaultRetry,
	defaultStaleTime,
}: RouterProps) => {
	const { useRouteItemData, usePendingState } = router.hooks;
	const [routeItemData] = useRouteItemData();
	const [pendingState] = usePendingState();
	const loaderState = router.state.loaderStateRef.value;
	const isLoading = Boolean(pendingState);

	useNavigation();

	useSetRouterConfig({
		routes,
		isAnimated,
		defaultPrefetch,
		defaultHoverPrefetchDelay,
		defaultBeforeLoad,
		defaultAfterLoad,
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
