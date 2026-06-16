import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { comparePaths, parseWindowLocation } from '../utils/utils.ts';
import { useLatest } from './useLatest.ts';
import type { BlockerState, Location, RouteItem, UpdateBlockedRouteProps } from '../types/global.ts';

type BlockedRoute = { from: string; to: string };

type UseHandleNavigation = {
	routeList: RouteItem[];
	setLocation: (arg: Location) => void;
	context: Record<string, unknown>;
	revalidateCache(routeItem?: RouteItem, isCurrentRoute?: boolean): Promise<void>;
	isAnimated: boolean;
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
}: UseHandleNavigation) => {
	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });
	const [beforeLoadError, setBeforeLoadError] = useState<boolean>(false);

	const prevPathname = useRef<string>('');
	const navigationSeq = useRef<number>(0);

	const navigation = useCallback(
		(nextLocation: Location) => {
			setLocation(nextLocation);
			prevPathname.current = nextLocation.pathname;
			if (nextLocation.pathname === window.location.pathname) return;
			history.pushState(null, '', nextLocation.pathname);
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
			const nextItem = routeList.find(el => comparePaths(el, nextLocation.pathname));
			console.log(nextItem?.path);
			if (nextItem?.beforeLoad) {
				try {
					// eslint-disable-next-line react-hooks/immutability
					await nextItem.beforeLoad({ context, redirect: navigationHandler });
				} catch {
					setBeforeLoadError(true);
					transitionedNavigation({ nextLocation, isAnimated: false });
					return;
				}
			}
			if (seq !== navigationSeq.current) return;
			await revalidateCache(nextItem, true);
			if (seq !== navigationSeq.current) return;
			transitionedNavigation({ nextLocation, isFirstCall, isAnimated });
			setBeforeLoadError(false);
			if (nextItem?.afterLoad) {
				await nextItem.afterLoad(context);
			}
		},
		[context, revalidateCache, routeList, transitionedNavigation, isAnimated]
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

	return { blockerState, updateLocation, updateBlockedRoute, beforeLoadError };
};
