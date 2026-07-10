import { RefObject, useCallback, useEffect, useRef } from 'react';
import { useLatest } from './useLatest';
import {
	useBlockedRoute,
	useIsLoading,
	useLoaderFallback,
	useCurrentLoaderState,
	useRouteItemData,
	useScrollMap,
	useContextState,
} from '../state/state';
import { routerConfig } from '../config/routerConfig';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils';
import { emptyLoaderState } from '../constants';
import { LoaderState, Location, RevalidateCacheArgs, RouteItem, UpdateBlockedRouteProps } from '../types/global';

type UseHandleNavigation = {
	routes: RouteItem[];
	revalidateCache(arg: RevalidateCacheArgs): Promise<unknown>;
	isCacheItemFresh(arg: { routeItem?: RouteItem; pathname: string }): boolean;
	loaderStateRef: RefObject<LoaderState>;
};

const ALL_LOCATIONS = '*';

export const useHandleNavigation = ({
	routes,
	revalidateCache,
	isCacheItemFresh,
	loaderStateRef,
}: UseHandleNavigation) => {
	const { isAnimated, showFallbackOnAnimation: showFallback } = routerConfig;
	const [context, setContext] = useContextState();
	const [, setIsLoading] = useIsLoading();
	const [, setCurrentLoaderFallback] = useLoaderFallback();
	const [, setLoaderState] = useCurrentLoaderState();
	const [, setScrollMap] = useScrollMap();

	const [blockedRoute, setBlockedRoute] = useBlockedRoute();
	const [, setRouteItemData] = useRouteItemData();

	const prevPathname = useRef<string>('');
	const navigationSeq = useRef<number>(0);

	const navigation = useCallback(
		(nextLocation: Location, routeItem: RouteItem | undefined) => {
			setRouteItemData({ routeItem, location: nextLocation });
			setLoaderState(loaderStateRef.current);
			setIsLoading(false);
			setCurrentLoaderFallback(undefined);
			prevPathname.current = nextLocation.pathname;
			const fullPath = nextLocation.search
				? `${nextLocation.pathname}${nextLocation.search}`
				: nextLocation.pathname;
			if (fullPath === window.location.pathname + window.location.search) return;
			history.pushState(null, '', fullPath);
		},
		[loaderStateRef, setCurrentLoaderFallback, setIsLoading, setLoaderState, setRouteItemData]
	);

	const transitionedNavigation = useCallback(
		(nextLocation: Location, routeItem: RouteItem | undefined) => {
			if (!isAnimated) {
				navigation(nextLocation, routeItem);
				return;
			}
			try {
				document.startViewTransition(() => navigation(nextLocation, routeItem));
			} catch {
				navigation(nextLocation, routeItem);
			}
		},
		[navigation, isAnimated]
	);

	const navigationHandler = useCallback(
		async (nextLocation: Location) => {
			navigationSeq.current = navigationSeq.current + 1;
			const seq = navigationSeq.current;
			loaderStateRef.current = emptyLoaderState;

			const nextItem = routes.find(el => el.path === ALL_LOCATIONS || comparePaths(el, nextLocation.pathname));

			const params: Record<string, string> = getParamsObject({
				params: nextItem?.params,
				pathname: nextLocation.pathname,
			});

			if (nextItem?.beforeLoad) {
				const redirect = async (location: Location | string) =>
					// eslint-disable-next-line react-hooks/immutability
					await navigationHandler(typeof location === 'string' ? { pathname: location } : location);
				try {
					await nextItem.beforeLoad({
						context,
						redirect,
						params,
						setContext,
					});
					loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: null };
				} catch (error) {
					loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: error as Error };
					return transitionedNavigation(nextLocation, nextItem);
				}
			}
			if (seq !== navigationSeq.current) return;
			setScrollMap(prevState => {
				const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
				if (!scrollPosition || prevState[prevPathname.current] === scrollPosition) return prevState;
				return { ...prevState, [prevPathname.current]: scrollPosition };
			});
			setCurrentLoaderFallback(
				isCacheItemFresh({ routeItem: nextItem, pathname: nextLocation.pathname }) ||
					(isAnimated && !showFallback)
					? undefined
					: nextItem?.loaderFallback
			);
			if (nextItem?.loader) {
				setIsLoading(true);
				await revalidateCache({ routeItem: nextItem, pathname: nextLocation.pathname });
			}
			if (seq !== navigationSeq.current) return;
			transitionedNavigation(nextLocation, nextItem);
			if (nextItem?.afterLoad) await nextItem.afterLoad({ context, params, setContext });
		},
		[
			context,
			isAnimated,
			isCacheItemFresh,
			loaderStateRef,
			revalidateCache,
			routes,
			setContext,
			setCurrentLoaderFallback,
			setIsLoading,
			setScrollMap,
			showFallback,
			transitionedNavigation,
		]
	);

	const setNextLocationRef = useLatest(navigationHandler);

	const updateBlockedRoute = useCallback(
		({ type, payload = '' }: UpdateBlockedRouteProps) =>
			setBlockedRoute(prevState => {
				if (prevState.from === payload && type === 'charge') return prevState;
				if (payload && prevState.from !== payload && type === 'charge') return { ...prevState, from: payload };
				if (type === 'reset') return { ...prevState, to: '' };
				if (type === 'process') setNextLocationRef.current({ pathname: prevState.to });
				if (!prevState.from && !prevState.to) return prevState;
				return { from: '', to: '' };
			}),
		[setBlockedRoute, setNextLocationRef]
	);

	const updateLocation = useCallback(
		async (nextLocation: Location) => {
			if (blockedRoute.from) {
				setBlockedRoute(prevState => ({ ...prevState, to: nextLocation.pathname }));
			} else {
				await setNextLocationRef.current(nextLocation);
			}
		},
		[blockedRoute.from, setBlockedRoute, setNextLocationRef]
	);

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			if (prevPathname.current === blockedRoute.from) {
				setBlockedRoute({ from: prevPathname.current, to: newLocation.pathname });
				history.pushState(null, '', prevPathname.current);
			} else {
				setNextLocationRef.current(newLocation);
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRoute.from, setBlockedRoute, setNextLocationRef]);

	useEffect(() => {
		const currentLocation = parseWindowLocation(window.location);
		setNextLocationRef.current(currentLocation);
		prevPathname.current = currentLocation.pathname;
	}, [setNextLocationRef]);

	return { updateLocation, updateBlockedRoute };
};
