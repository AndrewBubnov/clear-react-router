import { PropsWithChildren } from 'react';
import { useNavigationState } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types/global';

const EmptyBoundary = ({ children }: PropsWithChildren) => children;

export const Router = ({
	isAnimated,
	animationDuration,
	spinner = true,
	preserveScroll = true,
	showFallbackIfAnimated = false,
	prefetch = 'hover',
	hoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
	errorBoundary: ErrorBoundary = EmptyBoundary,
}: RouterProps) => {
	const {
		routeItemData: { routeItem, location },
		loaderState,
		currentLoaderFallback,
		isLoading,
	} = useNavigationState();

	usePreserveScroll(preserveScroll);

	useApplyCustomAnimation(animationDuration);

	useSetRouterConfig({ isAnimated, showFallbackIfAnimated, prefetch, hoverPrefetchDelay });

	const showErrorElement = !isLoading && Boolean(loaderState.loaderError || loaderState.beforeLoadError);

	const showSpinner = spinner && isAnimated && isLoading;
	const loadingContent = !showErrorElement && isLoading;

	if ((showFallbackIfAnimated || !isAnimated) && loadingContent) {
		return renderElement(currentLoaderFallback);
	}

	if (!showFallbackIfAnimated && isAnimated && loadingContent) return <Spinner />;

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
