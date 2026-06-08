import { type ReactElement, useCallback, useMemo, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import { useBlockNavigation } from './hooks/useBlockNavigation.ts';
import { useLoader } from './hooks/useLoader.ts';
import { comparePaths, getParamsObject, parseWindowLocation } from './utils/utils.ts';
import type { Location, RouteItem } from './types.ts';

type RouterProps = {
	routeList: RouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';
const ALL_LOCATIONS = '*';

export const Router = ({ routeList }: RouterProps) => {
	const [location, setLocation] = useState<Location>(parseWindowLocation(window.location));

	const { blockerState, updateLocation, updateBlockedRoute } = useBlockNavigation(routeList, setLocation);

	const routeItem = useMemo(
		() => routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname)),
		[location.pathname, routeList]
	);

	const { loaderError, loaderCache, prefetchLoader } = useLoader(routeList, routeItem);

	const renderElement = useCallback((Component?: (() => ReactElement) | ReactElement) => {
		if (!Component) return null;
		return typeof Component === 'function' ? <Component /> : Component;
	}, []);

	const params = useMemo(() => {
		if (!routeItem?.params) return {};
		const { pathname } = window.location;
		const split = pathname.split('/');
		return getParamsObject(routeItem.params, split);
	}, [routeItem]);

	const providerProps = useMemo(
		() => ({
			location,
			updateLocation,
			params,
			loaderCache,
			prefetchLoader,
			updateBlockedRoute,
			blockerState,
		}),
		[blockerState, loaderCache, location, params, prefetchLoader, updateBlockedRoute, updateLocation]
	);

	if (routeItem?.loader && !loaderError && !loaderCache[routeItem?.path])
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.fallback)}</RouterProvider>;

	if (routeItem?.loader && loaderError)
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.errorElement)}</RouterProvider>;

	return <RouterProvider {...providerProps}>{renderElement(routeItem?.element) || PAGE_NOT_FOUND}</RouterProvider>;
};
