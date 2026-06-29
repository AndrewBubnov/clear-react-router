import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from './useLatest';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils';
import {
	BlockerState,
	LoaderState,
	Location,
	RevalidateCacheArgs,
	RouteItem,
	RouteItemData,
	UpdateBlockedRouteProps,
} from '../types/global';

type BlockedRoute = { from: string; to: string };

type UseHandleNavigation = {
	routeList: RouteItem[];
	context: Record<string, unknown>;
	revalidateCache(arg: RevalidateCacheArgs): Promise<void>;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	setIsLoading: Dispatch<SetStateAction<boolean>>;
};

const ALL_LOCATIONS = '*';

export const useHandleNavigation = ({
	routeList,
	context,
	revalidateCache,
	setContext,
	setIsLoading,
}: UseHandleNavigation) => {
	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });
	const [routeItemData, setRouteItemData] = useState<RouteItemData>({
		location: {} as Location,
		routeItem: undefined,
		loaderState: {} as LoaderState,
	});
	const [scrollMap, setScrollMap] = useState<Record<string, number>>({});
	const [currentLoaderFallback, setCurrentLoaderFallback] = useState<RouteItem['loaderFallback']>();

	const loaderState = useRef<LoaderState>({} as LoaderState);
	const prevPathname = useRef<string>('');
	const navigationSeq = useRef<number>(0);

	const scrollMapRef = useLatest(scrollMap);

	const setSearch = useCallback(
		(search: string) =>
			setRouteItemData(prevState => ({ ...prevState, location: { ...prevState.location, search } })),
		[]
	);

	const restoreScroll = useCallback(() => {
		if (!prevPathname.current || !scrollMapRef.current[prevPathname.current]) return;
		requestAnimationFrame(() => {
			window.scrollTo({ top: scrollMapRef.current[prevPathname.current], behavior: 'smooth' });
		});
	}, [scrollMapRef]);

	const navigation = useCallback(
		(nextLocation: Location, routeItem: RouteItem | undefined) => {
			setRouteItemData({
				location: nextLocation,
				routeItem,
				loaderState: loaderState.current,
			});
			setIsLoading(false);
			prevPathname.current = nextLocation.pathname;
			const fullPath = nextLocation.search
				? `${nextLocation.pathname}${nextLocation.search}`
				: nextLocation.pathname;
			if (fullPath === window.location.pathname + window.location.search) return;
			history.pushState(null, '', fullPath);
		},
		[setIsLoading]
	);

	const transitionedNavigation = useCallback(
		(nextLocation: Location, routeItem: RouteItem | undefined) => {
			setScrollMap(prevState => {
				const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
				if (!scrollPosition || prevState[prevPathname.current] === scrollPosition) return prevState;
				return { ...prevState, [prevPathname.current]: scrollPosition };
			});
			try {
				document.startViewTransition(() => navigation(nextLocation, routeItem));
			} catch {
				navigation(nextLocation, routeItem);
			}
		},
		[navigation]
	);

	const navigationHandler = useCallback(
		async (nextLocation: Location) => {
			navigationSeq.current = navigationSeq.current + 1;
			const seq = navigationSeq.current;
			loaderState.current = {} as LoaderState;

			const nextItem = routeList.find(el => el.path === ALL_LOCATIONS || comparePaths(el, nextLocation.pathname));

			const params: Record<string, string> = getParamsObject({
				params: nextItem?.params,
				pathname: nextLocation.pathname,
			});

			if (nextItem?.beforeLoad) {
				try {
					const redirect = async (location: Location | string) =>
						// eslint-disable-next-line react-hooks/immutability
						await navigationHandler(typeof location === 'string' ? { pathname: location } : location);
					await nextItem.beforeLoad({
						context,
						redirect,
						params,
						setContext,
					});
					loaderState.current = { ...loaderState.current, beforeLoadError: null };
				} catch (error) {
					loaderState.current = { ...loaderState.current, beforeLoadError: error as Error };
					return transitionedNavigation(nextLocation, nextItem);
				}
			}
			if (seq !== navigationSeq.current) return;
			setCurrentLoaderFallback(nextItem?.loaderFallback);
			await revalidateCache({ routeItem: nextItem, loaderState, pathname: nextLocation.pathname });
			if (seq !== navigationSeq.current) return;
			transitionedNavigation(nextLocation, nextItem);
			if (nextItem?.afterLoad) await nextItem.afterLoad({ context, params, setContext });
		},
		[context, revalidateCache, routeList, transitionedNavigation, setContext]
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
		[setNextLocationRef]
	);

	const updateLocation = useCallback(
		async (nextLocation: Location) => {
			if (blockedRoute.from) {
				setBlockedRoute(prevState => ({ ...prevState, to: nextLocation.pathname }));
			} else {
				await setNextLocationRef.current(nextLocation);
			}
		},
		[blockedRoute.from, setNextLocationRef]
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
	}, [blockedRoute.from, setNextLocationRef]);

	useEffect(() => {
		const currentLocation = parseWindowLocation(window.location);
		setNextLocationRef.current(currentLocation);
		prevPathname.current = currentLocation.pathname;
	}, [setNextLocationRef]);

	const blockerState: BlockerState = useMemo(() => {
		if (blockedRoute.from && blockedRoute.to) return 'blocked';
		if (blockedRoute.from) return 'charged';
		return 'unblocked';
	}, [blockedRoute]);

	return {
		blockerState,
		updateLocation,
		updateBlockedRoute,
		routeItemData,
		setSearch,
		restoreScroll,
		currentLoaderFallback,
	};
};
