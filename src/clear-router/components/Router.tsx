import { useMemo } from 'react';
import { useNavigationState, useRouterData } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation.ts';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { ViewProvider } from '../provider/ViewProvider';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { getParamsObject } from '../utils/utils';

type RouterProps = {
	isAnimated?: boolean;
	animationDuration?: number;
	spinner?: boolean;
	preserveScroll?: boolean;
};

export const Router = ({ isAnimated, animationDuration, spinner = true, preserveScroll = true }: RouterProps) => {
	const {
		isLoading,
		routeItemData: { routeItem, location },
	} = useNavigationState();
	const { loaderState } = useRouterData();

	usePreserveScroll(preserveScroll, location.pathname);

	useApplyCustomAnimation(animationDuration);

	const params: Record<string, string> = useMemo(
		() =>
			getParamsObject({
				params: routeItem?.params,
				pathname: location.pathname,
			}),
		[location.pathname, routeItem?.params]
	);

	const shouldErrorElementShown = useMemo(
		() => Boolean(loaderState[location.pathname]?.loaderError || loaderState[location.pathname]?.beforeLoadError),
		[loaderState, location.pathname]
	);

	if (!routeItem) return null;

	if (!isAnimated && !shouldErrorElementShown && isLoading)
		return <ViewProvider params={params}>{renderElement(routeItem.loaderFallback)}</ViewProvider>;

	if (shouldErrorElementShown) {
		return (
			<ViewProvider params={params}>
				{renderElement(routeItem.errorElement)}
				{spinner && isAnimated && isLoading && <Spinner />}
			</ViewProvider>
		);
	}

	return (
		<div style={{ viewTransitionName: 'page' }}>
			<ViewProvider params={params}>
				{renderElement(routeItem.element) || null}
				{spinner && isAnimated && isLoading && <Spinner />}
			</ViewProvider>
		</div>
	);
};
