import { useNavigationState } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';

type RouterProps = {
	isAnimated?: boolean;
	animationDuration?: number;
	spinner?: boolean;
	preserveScroll?: boolean;
	showFallbackIfAnimated?: boolean;
};

export const Router = ({
	isAnimated,
	animationDuration,
	spinner = true,
	preserveScroll = true,
	showFallbackIfAnimated = false,
}: RouterProps) => {
	const {
		routeItemData: { routeItem, loaderState },
		currentLoaderFallback,
	} = useNavigationState();

	usePreserveScroll(preserveScroll);

	useApplyCustomAnimation(animationDuration);

	const isLoading = Boolean(currentLoaderFallback);

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
