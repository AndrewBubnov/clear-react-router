import { PropsWithChildren, useEffect } from 'react';
import {
	useIsLoading,
	useLoaderFallback,
	useCurrentLoaderState,
	useRouteItemData,
	useCallbackState,
} from '../state/state';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig';
import { useSetInitialContext } from '../hooks/useSetInitialContext';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types/global';
import { useLoader } from '../hooks/useLoader.ts';
import { useNavigation } from '../hooks/useNavigation.ts';

const EmptyBoundary = ({ children }: PropsWithChildren) => children;

export const Router = ({
	routes,
	isAnimated,
	animationDuration,
	spinner = true,
	preserveScroll = true,
	showFallbackOnAnimation = false,
	prefetch = 'hover',
	hoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
	errorBoundary: ErrorBoundary = EmptyBoundary,
	context: initialContext,
}: RouterProps) => {
	const [isLoading] = useIsLoading();
	const [currentLoaderFallback] = useLoaderFallback();
	const [routeItemData] = useRouteItemData();

	const [loaderState] = useCurrentLoaderState();
	const [, setCallbackState] = useCallbackState();

	const { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef, invalidate } = useLoader(routes);

	const updateLocation = useNavigation({
		routes,
		revalidateCache,
		isCacheItemFresh,
		loaderStateRef,
	});

	useEffect(() => {
		setCallbackState({
			updateLocation,
			prefetchLoader,
			invalidate,
		});
	}, [invalidate, prefetchLoader, setCallbackState, updateLocation]);

	usePreserveScroll(preserveScroll);

	useApplyCustomAnimation(animationDuration);

	useSetRouterConfig({ isAnimated, showFallbackOnAnimation, prefetch, hoverPrefetchDelay });

	useSetInitialContext(initialContext);

	const showErrorElement = !isLoading && Boolean(loaderState.loaderError || loaderState.beforeLoadError);

	const showSpinner = spinner && isAnimated && isLoading;
	const loadingContent = !showErrorElement && isLoading;
	const { routeItem, location } = routeItemData;

	if ((showFallbackOnAnimation || !isAnimated) && loadingContent) {
		return renderElement(currentLoaderFallback);
	}

	if (!showFallbackOnAnimation && isAnimated && loadingContent) return <Spinner />;

	if (!routeItem) return null;

	if (showErrorElement) {
		return (
			<>
				{renderElement(routeItem.errorElement)}
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
