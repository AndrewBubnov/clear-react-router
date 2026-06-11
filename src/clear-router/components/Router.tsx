import { useMemo, useState } from 'react';
import { RouterProvider } from '../provider/RouterProvider';
import { useHandleNavigation } from '../hooks/useHandleNavigation';
import { useLoader } from '../hooks/useLoader';
import { renderElement } from '../utils/renderElement';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils';
import type { Location, RouteItem } from '../types/global.ts';

type RouterProps = {
	routeList: RouteItem[];
	context?: Record<string, unknown>;
};

const PAGE_NOT_FOUND = 'error 404. Page not found';
const ALL_LOCATIONS = '*';

export const Router = ({ routeList, context: initialContext = {} }: RouterProps) => {
	const [location, setLocation] = useState<Location>(parseWindowLocation(window.location));
	const [context, setContext] = useState<Record<string, unknown>>(initialContext);

	const routeItem = useMemo(
		() => routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname)),
		[location.pathname, routeList]
	);

	const { loaderError, loaderCache, prefetchLoader, revalidateCache, isLoading } = useLoader(routeList);

	const { blockerState, updateLocation, updateBlockedRoute } = useHandleNavigation({
		setLocation,
		routeList,
		context,
		revalidateCache,
	});

	const params = useMemo(() => (routeItem?.params ? getParamsObject(routeItem.params) : {}), [routeItem]);

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

	if (routeItem?.loader && !loaderError && isLoading)
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.loaderFallback)}</RouterProvider>;

	if (loaderError)
		return <RouterProvider {...providerProps}>{renderElement(routeItem?.errorElement)}</RouterProvider>;

	return <RouterProvider {...providerProps}>{renderElement(routeItem?.element) || PAGE_NOT_FOUND}</RouterProvider>;
};
