import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { comparePaths, parseWindowLocation } from '../utils/utils.ts';
import { useLatest } from './useLatest.ts';
import type { BlockerState, Location, RouteItem, UpdateBlockedRouteProps } from '../types/global.ts';

type BlockedRoute = { from: string; to: string };

type Redirect = {
	cause: 'redirect';
	url: string;
	search?: string;
};

const isRedirect = (error: unknown): error is Redirect =>
	typeof error === 'object' && error !== null && (error as Error).cause === 'redirect';

type UseHandleNavigation = {
	routeList: RouteItem[];
	setLocation: (arg: Location) => void;
	context: Record<string, unknown>;
	revalidateCache(routeItem?: RouteItem, isCurrentRoute?: boolean): Promise<void>;
	animated: boolean;
};

export const useHandleNavigation = ({
	setLocation,
	routeList,
	context,
	revalidateCache,
	animated,
}: UseHandleNavigation) => {
	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });

	const prevPathname = useRef<string>('');

	const transitionedNavigation = useCallback(
		(nextLocation: Location, replace?: boolean) => {
			setLocation(nextLocation);
			prevPathname.current = nextLocation.pathname;
			if (nextLocation.pathname === window.location.pathname) return;
			if (replace) {
				history.replaceState(null, '', nextLocation.pathname);
			} else {
				history.pushState(null, '', nextLocation.pathname);
			}
		},
		[setLocation]
	);

	const setNextLocation = useCallback(
		async (nextLocation: Location) => {
			try {
				const nextItem = routeList.find(el => comparePaths(el, nextLocation.pathname));
				if (nextItem?.beforeLoad) await nextItem?.beforeLoad(context);

				await revalidateCache(nextItem, true);

				if (animated && 'startViewTransition' in document) {
					document.startViewTransition(() => transitionedNavigation(nextLocation));
				} else {
					transitionedNavigation(nextLocation);
				}
				if (nextItem?.afterLoad) await nextItem?.afterLoad(context);
			} catch (error) {
				const redirect = error as { cause: string; url: string; search?: string };
				if (!isRedirect(redirect)) return redirect;
				const navigateTo = { pathname: redirect.url, search: redirect.search || '' };
				if (animated && 'startViewTransition' in document) {
					document.startViewTransition(() => transitionedNavigation(navigateTo, true));
				} else {
					transitionedNavigation(navigateTo, true);
				}
			}
		},
		[animated, context, revalidateCache, routeList, transitionedNavigation]
	);

	const setNextLocationRef = useLatest(setNextLocation);

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

	return { blockerState, updateLocation, updateBlockedRoute };
};
