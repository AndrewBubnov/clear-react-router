import { PropsWithChildren } from 'react';
import { router } from '../instance';
import { useNavigation } from '../hooks/useNavigation';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig';
import { useSetInitialContext } from '../hooks/useSetInitialContext';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { isMobile } from '../utils/utils';
import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types';

const EmptyBoundary = ({ children }: PropsWithChildren) => children;

const IS_MOBILE = isMobile();
const MOBILE_CACHE_SIZE = 60;
const DESKTOP_CACHE_SIZE = 150;

export const Router = ({
	routes,
	defaultBeforeLoad,
	defaultAfterLoad,
	animationDuration,
	defaultLoaderFallback,
	defaultErrorElement,
	defaultRetry,
	defaultStaleTime,
	context: initialContext,
	isAnimated = false,
	optimisticSpinner = true,
	defaultPreserveScroll = true,
	defaultMinLoaderDuration = 0,
	maxCacheSize = IS_MOBILE ? MOBILE_CACHE_SIZE : DESKTOP_CACHE_SIZE,
	defaultPrefetch = IS_MOBILE ? 'viewport' : 'hover',
	defaultHoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
	errorBoundary: ErrorBoundary = EmptyBoundary,
}: RouterProps) => {
	const { useRouteItemData, usePendingState, useOptimisticLoading } = router.hooks;
	const [routeItemData] = useRouteItemData();
	const [pendingRouteData] = usePendingState();
	const [isOptimisticLoading] = useOptimisticLoading();
	const loaderState = router.state.loaderStateRef.value;
	const isLoading = Boolean(pendingRouteData);

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
		defaultMinLoaderDuration,
		maxCacheSize,
	});
	useApplyCustomAnimation(animationDuration);
	useSetInitialContext(initialContext);
	usePreserveScroll(routeItemData);

	const { routeItem, location } = routeItemData;

	const showErrorElement = !isLoading && Boolean(loaderState.loaderError || loaderState.beforeLoadError);

	const loadingContent = !showErrorElement && isLoading;

	if (loadingContent) return renderElement(pendingRouteData?.routeItem?.loaderFallback || defaultLoaderFallback);

	if (!routeItem) return null;

	if (showErrorElement) return renderElement(routeItem.errorElement || defaultErrorElement);

	return (
		<div style={{ viewTransitionName: 'page' }}>
			<ErrorBoundary key={location.pathname}>{renderElement(routeItem.element)}</ErrorBoundary>
			{optimisticSpinner && isOptimisticLoading && <Spinner />}
		</div>
	);
};
