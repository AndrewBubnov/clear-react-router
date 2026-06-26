import { useMemo } from 'react';
import { useNavigationState, usePropsData, useRouterData } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation';
import { usePreserveScroll } from '../hooks/usePreserveScroll';
import { ViewProvider } from '../provider/ViewProvider';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { comparePaths, getParamsObject } from '../utils/utils';

type RouterProps = {
	isAnimated?: boolean;
	animationDuration?: number;
	spinner?: boolean;
	preserveScroll?: boolean;
};

const ALL_LOCATIONS = '*';

export const Router = ({ isAnimated, animationDuration, spinner = true, preserveScroll = true }: RouterProps) => {
	const { location, isLoading, nextItemData } = useNavigationState();
	const { routeList } = usePropsData();
	const { loaderState } = useRouterData();

	usePreserveScroll({ nextPathname: nextItemData.pathname, pathname: location.pathname, preserveScroll });

	useApplyCustomAnimation(animationDuration);

	const routeItem = useMemo(() => {
		if (!location.pathname) return undefined;
		return routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname));
	}, [location.pathname, routeList]);

	const params: Record<string, string> = useMemo(
		() => getParamsObject({ params: nextItemData.params, pathname: nextItemData.pathname || location.pathname }),
		[location.pathname, nextItemData.params, nextItemData.pathname]
	);

	const shouldErrorElementShown = useMemo(
		() => Boolean(loaderState[location.pathname]?.loaderError || loaderState[location.pathname]?.beforeLoadError),
		[loaderState, location.pathname]
	);

	if (!routeItem && !nextItemData.loaderFallback) return null;

	if (!routeItem && nextItemData.loaderFallback)
		return <ViewProvider params={params}>{renderElement(nextItemData.loaderFallback)}</ViewProvider>;

	if (!isAnimated && !shouldErrorElementShown && isLoading && nextItemData.loaderFallback)
		return <ViewProvider params={params}>{renderElement(nextItemData.loaderFallback)}</ViewProvider>;

	if (shouldErrorElementShown) {
		return (
			<ViewProvider params={params}>
				{renderElement(routeItem?.errorElement)}
				{spinner && isAnimated && isLoading && <Spinner />}
			</ViewProvider>
		);
	}

	return (
		<div style={{ viewTransitionName: 'page' }}>
			<ViewProvider params={params}>
				{renderElement(routeItem?.element) || null}
				{spinner && isAnimated && isLoading && <Spinner />}
			</ViewProvider>
		</div>
	);
};
