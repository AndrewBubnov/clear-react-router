import { useNavigationState } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { useSetRouterConfig } from '../hooks/useSetRouterConfig';
import { STANDARD_PREFETCH_DELAY } from '../constants';
import { RouterProps } from '../types/global';

export const Router = ({
	isAnimated,
	animationDuration,
	spinner = true,
	preserveScroll = true,
	showFallbackIfAnimated = false,
	prefetch = 'hover',
	hoverPrefetchDelay = STANDARD_PREFETCH_DELAY,
}: RouterProps) => {
	const {
		routeItemData: { routeItem },
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
			{renderElement(routeItem.element) || null}
			{showSpinner && <Spinner />}
		</div>
	);
};
