import { useNavigationState } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation.ts';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig.ts';
import { RouterProps } from '../types/global.ts';
import { STANDARD_PREFETCH_DELAY } from '../constants.ts';

export const Router = ({
	isAnimated,
	animationDuration,
	spinner = true,
	preserveScroll = true,
	showFallbackIfAnimated = false,
	prefetch = 'hover',
	prefetchDelay = STANDARD_PREFETCH_DELAY,
}: RouterProps) => {
	const {
		routeItemData: { routeItem },
		loaderState,
		currentLoaderFallback,
		isLoading,
	} = useNavigationState();

	usePreserveScroll(preserveScroll);

	useApplyCustomAnimation(animationDuration);

	useSetRouterConfig({ isAnimated, showFallbackIfAnimated, prefetch, prefetchDelay });

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
			{renderElement(routeItem.element) || null}
			{showSpinner && <Spinner />}
		</div>
	);
};
