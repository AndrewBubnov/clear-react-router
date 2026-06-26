import { useMemo } from 'react';
import { useNavigationState, usePropsData, useRouterData } from '../hooks/useServiceContext';
import { ViewProvider } from '../provider/ViewProvider';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { comparePaths, getParamsObject } from '../utils/utils';

const ALL_LOCATIONS = '*';

export const Router = ({ spinner = true }: { spinner?: boolean }) => {
	const { location, isLoading } = useNavigationState();
	const { routeList, isAnimated } = usePropsData();
	const { loaderState } = useRouterData();

	const routeItem = useMemo(() => {
		if (!location.pathname) return undefined;
		return routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname));
	}, [location.pathname, routeList]);

	const pendingRoute = useMemo(() => {
		if (location.pathname) return undefined;
		return routeList.find(el => comparePaths(el, window.location.pathname));
	}, [location.pathname, routeList]);

	const params: Record<string, string> = useMemo(() => {
		const item = routeItem || pendingRoute;
		return getParamsObject({ routeItem: item, pathname: location.pathname || window.location.pathname });
	}, [location.pathname, routeItem, pendingRoute]);

	const shouldErrorElementShown = useMemo(
		() => Boolean(loaderState[location.pathname]?.loaderError || loaderState[location.pathname]?.beforeLoadError),
		[loaderState, location.pathname]
	);

	if (!routeItem && !pendingRoute) return null;

	if (!routeItem && pendingRoute)
		return <ViewProvider params={params}>{renderElement(pendingRoute?.loaderFallback)}</ViewProvider>;

	if (!isAnimated && !shouldErrorElementShown && isLoading)
		return <ViewProvider params={params}>{renderElement(routeItem?.loaderFallback)}</ViewProvider>;

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
