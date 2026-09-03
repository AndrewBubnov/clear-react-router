import { PropsWithChildren } from 'react';
import { router } from '../instance';
import { useNavigation } from '../hooks/useNavigation';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig';
import { useSetInitialContext } from '../hooks/useSetInitialContext';
import { useReload } from '../hooks/useReload';
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
	defaultMinLoaderDuration = 0,
	revalidateOnFocus = false,
	revalidateOnReconnect = false,
	maxCacheSize = IS_MOBILE ? MOBILE_CACHE_SIZE : DESKTOP_CACHE_SIZE,
	defaultPrefetch = IS_MOBILE ? 'viewport' : 'hover',
	defaultHoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
	defaultScrollRestorationBehavior = 'auto',
	errorBoundary: ErrorBoundary = EmptyBoundary,
}: RouterProps) => {
	const { useRouteItemData } = router.hooks;
	const [{ routeItem, status, location }] = useRouteItemData();

	const isError = status === 'error';
	const isLoading = status === 'pending';
	const isOptimistic = status === 'optimistic';

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
		defaultMinLoaderDuration,
		maxCacheSize,
		revalidateOnFocus,
		revalidateOnReconnect,
	});
	useApplyCustomAnimation(animationDuration);
	useSetInitialContext(initialContext);
	usePreserveScroll(defaultScrollRestorationBehavior);
	useReload();

	const loadingContent = isLoading && !isError;

	if (loadingContent) return renderElement(routeItem?.loaderFallback || defaultLoaderFallback);

	if (!routeItem) return null;

	if (isError) return renderElement(routeItem.errorElement || defaultErrorElement);

	return (
		<div style={{ viewTransitionName: 'page' }}>
			<ErrorBoundary key={location.pathname}>{renderElement(routeItem.element)}</ErrorBoundary>
			{optimisticSpinner && isOptimistic && <Spinner />}
		</div>
	);
};
