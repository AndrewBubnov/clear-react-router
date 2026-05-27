import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import { areOriginsEqual, getParamsObject, parseWindowLocation, processLoader } from './utils.ts';
import type { Location, RouteItem } from './types.ts';

type RouterProps = {
	routeList: RouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';
const ALL_LOCATIONS = '*';

export const Router = ({ routeList }: RouterProps) => {
	const [location, setLocation] = useState<Location>(parseWindowLocation(window.location));
	const [loaderResult, setLoaderResult] = useState<unknown>();
	const [loaderError, setLoaderError] = useState<boolean>(false);

	const routeItem = useMemo(
		() => routeList.find(el => el.path === ALL_LOCATIONS || areOriginsEqual(el.path, location.pathname)),
		[location.pathname, routeList]
	);

	useEffect(() => {
		const handler = (event: PopStateEvent) => setLocation(parseWindowLocation((event.target as Window).location));
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	useEffect(() => {
		processLoader(setLoaderResult, setLoaderError)(routeItem);
	}, [routeItem]);

	const params = useMemo(() => {
		if (!routeItem?.params) return {};
		const { pathname } = window.location;
		const split = pathname.split('/');
		return getParamsObject(routeItem.params, split);
	}, [routeItem]);

	const providerProps = useMemo(
		() => ({
			location,
			setLocation,
			params,
			loaderResult,
		}),
		[loaderResult, location, params]
	);

	if (routeItem?.loader && !loaderError && !loaderResult)
		return <RouterProvider {...providerProps}>{routeItem?.fallback || null}</RouterProvider>;

	if (routeItem?.loader && loaderError)
		return <RouterProvider {...providerProps}>{routeItem?.errorElement || null}</RouterProvider>;

	return <RouterProvider {...providerProps}>{routeItem?.element || PAGE_NOT_FOUND}</RouterProvider>;
};
