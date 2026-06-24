import { type Dispatch, type SetStateAction, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLatest } from './useLatest';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils';
import type {
	BlockerState,
	LoaderState,
	Location,
	RevalidateCacheArgs,
	RouteItem,
	UpdateBlockedRouteProps,
} from '../types/global';

type BlockedRoute = { from: string; to: string };

type UseHandleNavigation = {
	routeList: RouteItem[];
	setLocation: (arg: Location) => void;
	context: Record<string, unknown>;
	revalidateCache(arg: RevalidateCacheArgs): Promise<void>;
	isAnimated: boolean;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	setScrollMap: Dispatch<SetStateAction<Record<string, number>>>;
	setLoaderState: Dispatch<SetStateAction<LoaderState>>;
};

type TransitionedNavigationArgs = {
	nextLocation: Location;
	isAnimated?: boolean;
	isFirstCall?: boolean;
};

export const useHandleNavigation = ({
	setLocation,
	routeList,
	context,
	revalidateCache,
	isAnimated,
	setContext,
	setScrollMap,
	setLoaderState,
}: UseHandleNavigation) => {
	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });

	const prevPathname = useRef<string>('');
	const navigationSeq = useRef<number>(0);

	const updateScrollMap = useCallback(
		() =>
			setScrollMap(prevState => {
				const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
				if (!scrollPosition || prevState[prevPathname.current] === scrollPosition) return prevState;
				return { ...prevState, [prevPathname.current]: scrollPosition };
			}),
		[setScrollMap]
	);

	const navigation = useCallback(
		(nextLocation: Location) => {
			setLocation(nextLocation);
			prevPathname.current = nextLocation.pathname;
			const fullPath = nextLocation.search
				? `${nextLocation.pathname}${nextLocation.search}`
				: nextLocation.pathname;
			if (fullPath === window.location.pathname + window.location.search) return;
			history.pushState(null, '', fullPath);
		},
		[setLocation]
	);

	const transitionedNavigation = useCallback(
		({ nextLocation, isFirstCall, isAnimated }: TransitionedNavigationArgs) => {
			if (isAnimated && !isFirstCall) {
				try {
					document.startViewTransition(() => navigation(nextLocation));
				} catch {
					navigation(nextLocation);
				}
			} else {
				navigation(nextLocation);
			}
		},
		[navigation]
	);

	const navigationHandler = useCallback(
		async (nextLocation: Location, isFirstCall?: boolean) => {
			navigationSeq.current = navigationSeq.current + 1;
			const seq = navigationSeq.current;
			updateScrollMap();
			const nextItem = routeList.find(el => comparePaths(el, nextLocation.pathname));
			const params: Record<string, string> = getParamsObject({
				routeItem: nextItem,
				pathname: nextLocation.pathname,
			});

			if (nextItem?.beforeLoad) {
				try {
					const redirect = async (location: Location | string) =>
						typeof location === 'string'
							? await navigationHandler({ pathname: location })
							: await navigationHandler(location);
					await nextItem.beforeLoad({
						context,
						redirect,
						params,
						setContext,
					});
					setLoaderState(prevState => ({
						...prevState,
						[nextLocation.pathname]: { ...prevState[nextLocation.pathname], beforeLoadError: null },
					}));
				} catch (error) {
					setLoaderState(prevState => ({
						...prevState,
						[nextLocation.pathname]: {
							...prevState[nextLocation.pathname],
							beforeLoadError: error as Error,
						},
					}));
					transitionedNavigation({ nextLocation, isAnimated: false });
					return;
				}
			}
			if (seq !== navigationSeq.current) return;
			await revalidateCache({ routeItem: nextItem, isCurrentRoute: true, pathname: nextLocation.pathname });
			if (seq !== navigationSeq.current) return;
			transitionedNavigation({ nextLocation, isFirstCall, isAnimated });
			if (nextItem?.afterLoad) await nextItem.afterLoad({ context, params, setContext });
		},
		[
			context,
			revalidateCache,
			routeList,
			transitionedNavigation,
			isAnimated,
			setContext,
			updateScrollMap,
			setLoaderState,
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
		setNextLocationRef.current(currentLocation, true);
		prevPathname.current = currentLocation.pathname;
	}, [setNextLocationRef]);

	const blockerState: BlockerState = useMemo(() => {
		if (blockedRoute.from && blockedRoute.to) return 'blocked';
		if (blockedRoute.from) return 'charged';
		return 'unblocked';
	}, [blockedRoute]);

	return { blockerState, updateLocation, updateBlockedRoute };
};
