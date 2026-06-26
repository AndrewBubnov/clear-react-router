import { useMemo } from 'react';
import { useNavigationState, usePropsData, useRouterData } from '../hooks/useServiceContext';
import { useApplyCustomAnimation } from '../hooks/useApplyCustomAnimation.ts';
import { ViewProvider } from '../provider/ViewProvider';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { comparePaths, getParamsObject } from '../utils/utils';
import { usePreserveScroll } from '../hooks/usePreserveScroll.ts';

type RouterProps = {
	isAnimated?: boolean;
	animationDuration?: number;
	spinner?: boolean;
	preserveScroll?: boolean;
};

const ALL_LOCATIONS = '*';

export const Router = ({ isAnimated, animationDuration, spinner = true, preserveScroll = true }: RouterProps) => {
	const { location, isLoading, nextItem } = useNavigationState();
	const { routeList } = usePropsData();
	const { loaderState } = useRouterData();

	usePreserveScroll({ nextPathname: nextItem?.path, pathname: location.pathname, preserveScroll });

	useApplyCustomAnimation(animationDuration);

	const routeItem = useMemo(() => {
		if (!location.pathname) return undefined;
		return routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname));
	}, [location.pathname, routeList]);

	const params: Record<string, string> = useMemo(() => {
		const item = routeItem || nextItem;
		return getParamsObject({ routeItem: item, pathname: location.pathname || window.location.pathname });
	}, [location.pathname, routeItem, nextItem]);

	const shouldErrorElementShown = useMemo(
		() => Boolean(loaderState[location.pathname]?.loaderError || loaderState[location.pathname]?.beforeLoadError),
		[loaderState, location.pathname]
	);

	if (!routeItem && !nextItem) return null;

	if (!routeItem && nextItem)
		return <ViewProvider params={params}>{renderElement(nextItem?.loaderFallback)}</ViewProvider>;

	if (!isAnimated && !shouldErrorElementShown && isLoading)
		return <ViewProvider params={params}>{renderElement(nextItem?.loaderFallback)}</ViewProvider>;

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
