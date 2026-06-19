import { useMemo } from 'react';
import { Spinner } from './Spinner';
import { renderElement } from '../utils/renderElement';
import { comparePaths, getParamsObject } from '../utils/utils';
import { useNavigationState, usePropsData } from '../hooks/useServiceContext';
import { ViewProvider } from '../provider/ViewProvider';

const PAGE_NOT_FOUND = 'error 404. Page not found';
const ALL_LOCATIONS = '*';

export const Router = ({ spinner = true }: { spinner?: boolean }) => {
	const { location, isLoading, shouldErrorElementShown } = useNavigationState();
	const { routeList, isAnimated } = usePropsData();

	const routeItem = useMemo(() => {
		if (!location.pathname) return undefined;
		return routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname));
	}, [location.pathname, routeList]);

	const params: Record<string, string> = useMemo(
		() => getParamsObject({ routeItem, pathname: window.location.pathname }),
		[routeItem]
	);

	if (spinner && !routeItem && isLoading) return <Spinner />;

	if (!routeItem && isLoading) return <Spinner />;

	if (!routeItem) return null;

	if (!isAnimated && routeItem?.loader && !shouldErrorElementShown && isLoading)
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
				{renderElement(routeItem?.element) || PAGE_NOT_FOUND}
				{spinner && isAnimated && isLoading && <Spinner />}
			</ViewProvider>
		</div>
	);
};
