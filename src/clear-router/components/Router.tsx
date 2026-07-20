import { PropsWithChildren } from 'react';
import { useRouter } from '../hooks/useRouter';
import { useNavigation } from '../hooks/useNavigation';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig';
import { useSetInitialContext } from '../hooks/useSetInitialContext';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types/global';

const EmptyBoundary = ({ children }: PropsWithChildren) => children;

export const Router = ({
	routes,
	animationDuration,
	isAnimated = false,
	spinner = true,
	preserveScroll = true,
	showFallbackOnAnimation = false,
	prefetch = 'hover',
	hoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
	errorBoundary: ErrorBoundary = EmptyBoundary,
	context: initialContext,
	defaultLoaderFallback,
	defaultErrorElement,
}: RouterProps) => {
	const instance = useRouter();
	const { useIsLoading, useLoaderFallback, useRouteItemData, useCurrentLoaderState } = instance.hooks;
	const [isLoading] = useIsLoading();
	const [currentLoaderFallback] = useLoaderFallback();
	const [routeItemData] = useRouteItemData();
	const [loaderState] = useCurrentLoaderState();

	useNavigation();

	useSetRouterConfig({ routes, isAnimated, prefetch, hoverPrefetchDelay, showFallbackOnAnimation });
	useApplyCustomAnimation(animationDuration);
	useSetInitialContext(initialContext);
	usePreserveScroll(preserveScroll);

	const showErrorElement = !isLoading && Boolean(loaderState.loaderError || loaderState.beforeLoadError);

	const showSpinner = spinner && isAnimated && isLoading;
	const loadingContent = !showErrorElement && isLoading;
	const { routeItem, location } = routeItemData;

	if ((showFallbackOnAnimation || !isAnimated) && loadingContent) {
		return renderElement(currentLoaderFallback || defaultLoaderFallback);
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
