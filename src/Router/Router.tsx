import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import { comparePaths, getParamsObject, parseWindowLocation } from './utils.ts';
import { useLoader } from './hooks/useLoader.ts';
import type { BlockerState, Location, RouteItem, UpdateBlockedRouteProps } from './types.ts';

type RouterProps = {
	routeList: RouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';
const ALL_LOCATIONS = '*';

export const Router = ({ routeList }: RouterProps) => {
	const [location, setLocation] = useState<Location>(parseWindowLocation(window.location));
	const [blockedRoute, setBlockedRoute] = useState<{ from: string; to: string }>({ from: '', to: '' });

	const routeItem = useMemo(
		() => routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, location.pathname)),
		[location.pathname, routeList]
	);

	const { loaderError, loaderCache, revalidateCache } = useLoader(routeItem);

	useEffect(() => {
		const handler = (event: PopStateEvent) => setLocation(parseWindowLocation((event.target as Window).location));
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	const updateLocation = useCallback(
		(nextLocation: Location) => {
			if (window.location.pathname !== blockedRoute.from) {
				setLocation(nextLocation);
				history.pushState(null, '', nextLocation.pathname);
				return;
			}
			setBlockedRoute(prevState => ({ ...prevState, to: nextLocation.pathname }));
		},
		[blockedRoute.from]
	);

	const renderElement = useCallback((Component?: (() => ReactElement) | ReactElement) => {
		if (!Component) return null;
		return typeof Component === 'function' ? <Component /> : Component;
	}, []);

	const updateBlockedRoute = useCallback(
		({ type, payload = '' }: UpdateBlockedRouteProps) =>
			setBlockedRoute(prevState => {
				if (prevState.from === payload && type === 'charge') return prevState;
				if (payload && prevState.from !== payload && type === 'charge') return { ...prevState, from: payload };
				if (type === 'reset') return { ...prevState, to: '' };
				if (type === 'process') {
					setLocation({ pathname: prevState.to });
					history.pushState(null, '', prevState.to);
				}
				if (!prevState.from && !prevState.to) return prevState;
				return { from: '', to: '' };
			}),
		[]
	);

	const prefetchLoader = useCallback(
		async (pathname: string) => {
			const item = routeList.find(el => comparePaths(el, pathname));
			if (item) await revalidateCache(item);
		},
		[revalidateCache, routeList]
	);

	const params = useMemo(() => {
		if (!routeItem?.params) return {};
		const { pathname } = window.location;
		const split = pathname.split('/');
		return getParamsObject(routeItem.params, split);
	}, [routeItem]);

	const blockerState: BlockerState = useMemo(() => {
		if (blockedRoute.from && blockedRoute.to) return 'blocked';
		if (blockedRoute.from) return 'charged';
		return 'unblocked';
	}, [blockedRoute]);

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
