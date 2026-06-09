import { useMemo, useState } from 'react';
import { RouterProvider } from '../provider/RouterProvider.tsx';
import { useHandleNavigation } from '../hooks/useHandleNavigation.ts';
import { useLoader } from '../hooks/useLoader.ts';
import { renderElement } from '../utils/renderElement.tsx';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils.ts';
import type { Location, RouteItem } from '../types/types.ts';

type RouterProps = {
	routeList: RouteItem[];
	initialContext?: Record<string, unknown>;
};

const PAGE_NOT_FOUND = 'error 404. Page not found';
const ALL_LOCATIONS = '*';

export const Router = ({ routeList, initialContext = {} }: RouterProps) => {
	const [location, setLocation] = useState<Location>(parseWindowLocation(window.location));
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	const routeItem = useMemo(
		() => routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname)),
		[location.pathname, routeList]
	);

	const { blockerState, updateLocation, updateBlockedRoute } = useHandleNavigation({
		setLocation,
		routeList,
		context,
	});

	const { loaderError, loaderCache, prefetchLoader } = useLoader({ routeList, currentRouteItem: routeItem });

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
			context,
			setContext,
		}),
		[blockerState, loaderCache, location, params, prefetchLoader, context, updateBlockedRoute, updateLocation]
	);

	if (routeItem?.loader && !loaderError && !loaderCache[routeItem?.path])
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.fallback)}</RouterProvider>;

	if (routeItem?.loader && loaderError)
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.errorElement)}</RouterProvider>;

	return <RouterProvider {...providerProps}>{renderElement(routeItem?.element) || PAGE_NOT_FOUND}</RouterProvider>;
};
