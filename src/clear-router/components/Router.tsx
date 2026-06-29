import { useMemo } from 'react';
import { useNavigationState, useRouterData } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation.ts';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';

type RouterProps = {
	isAnimated?: boolean;
	animationDuration?: number;
	spinner?: boolean;
	preserveScroll?: boolean;
};

export const Router = ({ isAnimated, animationDuration, spinner = true, preserveScroll = true }: RouterProps) => {
	const {
		isLoading,
		routeItemData: { routeItem },
		currentLoaderFallback,
	} = useNavigationState();
	const { loaderState } = useRouterData();

	usePreserveScroll(preserveScroll);

	useApplyCustomAnimation(animationDuration);

	const shouldErrorElementShown = useMemo(
		() => Boolean(loaderState.loaderError || loaderState.beforeLoadError),
		[loaderState]
	);

	if (!routeItem && isLoading) return <Spinner />;

	if (!routeItem) return null;

	if (!isAnimated && !shouldErrorElementShown && isLoading) return renderElement(currentLoaderFallback);

	if (shouldErrorElementShown) {
		return (
			<>
				{renderElement(routeItem.errorElement)}
				{spinner && isAnimated && isLoading && <Spinner />}
			</>
		);
	}

	return (
		<div style={{ viewTransitionName: 'page' }}>
			{renderElement(routeItem.element) || null}
			{spinner && isAnimated && isLoading && <Spinner />}
		</div>
	);
};
