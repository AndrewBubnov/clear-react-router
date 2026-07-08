import {
	type Dispatch,
	RefObject,
	type SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';
import { useLatest } from './useLatest';
import { routerConfig } from '../config/routerConfig';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils';
import { emptyLoaderState } from '../constants';
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
	routes: RouteItem[];
	context: Record<string, unknown>;
	revalidateCache(arg: RevalidateCacheArgs): Promise<unknown>;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	isCacheItemFresh(arg: { routeItem?: RouteItem; pathname: string }): boolean;
	loaderStateRef: RefObject<LoaderState>;
	clearTimestamp(path: string): void;
};

const ALL_LOCATIONS = '*';

export const useHandleNavigation = ({
	routes,
	context,
	revalidateCache,
	setContext,
	isCacheItemFresh,
	loaderStateRef,
	clearTimestamp,
}: UseHandleNavigation) => {
	const { isAnimated, showFallbackOnAnimation: showFallback } = routerConfig;
	const [isLoading, setIsLoading] = useState(false);

	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });
	const [routeItemData, setRouteItemData] = useState<RouteItemData>({
		routeItem: undefined,
		location: {} as Location,
	});
	const [scrollMap, setScrollMap] = useState<Record<string, number>>({});
	const [currentLoaderFallback, setCurrentLoaderFallback] = useState<RouteItem['loaderFallback']>();
	const [loaderState, setLoaderState] = useState<LoaderState>(emptyLoaderState);

	const prevPathname = useRef<string>('');
	const navigationSeq = useRef<number>(0);

	const scrollMapLatest = useLatest(scrollMap);

	const restoreScroll = useCallback(() => {
		if (!prevPathname.current || !scrollMapLatest.current[prevPathname.current]) return;
		requestAnimationFrame(() => {
			window.scrollTo({ top: scrollMapLatest.current[prevPathname.current], behavior: 'smooth' });
		});
	}, [scrollMapLatest]);

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
		[loaderStateRef]
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

	const invalidate = useCallback(
		async (pathname = routeItemData.location.pathname) => {
			if (typeof pathname !== 'string') return;
			const routeItem = routes.find(el => comparePaths(el, pathname));
			const resultParams = getParamsObject({
				params: routeItem?.params,
				pathname,
			});
			clearTimestamp(pathname);
			try {
				if (routeItem?.beforeLoad) {
					await routeItem.beforeLoad({
						context,
						redirect: () => Promise.resolve(),
						params: resultParams,
						setContext,
					});
				}
				loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: null };
			} catch (error) {
				loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: error as Error };
			}

			await revalidateCache({ routeItem, pathname: pathname });
			if (pathname === routeItemData.location.pathname) setLoaderState(loaderStateRef.current);
		},
		[clearTimestamp, context, loaderStateRef, revalidateCache, routeItemData.location.pathname, routes, setContext]
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
			revalidateCache,
			routes,
			transitionedNavigation,
			setContext,
			isCacheItemFresh,
			isAnimated,
			showFallback,
			loaderStateRef,
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
		restoreScroll,
		currentLoaderFallback,
		isLoading,
		loaderState,
		invalidate,
	};
};
