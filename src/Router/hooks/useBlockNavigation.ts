import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BlockerState, Location, RouteItem, UpdateBlockedRouteProps } from '../types.ts';
import { comparePaths, parseWindowLocation } from '../utils/utils.ts';
import { Redirect } from '../utils/redirect.ts';

type BlockedRoute = { from: string; to: string };

export const useBlockNavigation = (routeList: RouteItem[], setLocation: (arg: Location) => void) => {
	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });

	const prevPathname = useRef<string>('');

	const setNextLocation = useCallback(
		async (nextLocation: Location) => {
			try {
				const nextItem = routeList.find(el => comparePaths(el, nextLocation.pathname));
				if (nextItem?.beforeLoad) await nextItem?.beforeLoad();
				setLocation(nextLocation);
				history.pushState(null, '', nextLocation.pathname);
				prevPathname.current = nextLocation.pathname;
				if (nextItem?.afterLoad) await nextItem?.afterLoad();
			} catch (redirect) {
				if (!(redirect instanceof Redirect)) return redirect;
				if (redirect.url === nextLocation.pathname) return;
				history.replaceState(null, '', `${redirect.url}${redirect.search || ''}`);
				setLocation({ pathname: redirect.url, search: redirect.search });
			}
		},
		[routeList, setLocation]
	);

	const updateBlockedRoute = useCallback(
		({ type, payload = '' }: UpdateBlockedRouteProps) =>
			setBlockedRoute(prevState => {
				if (prevState.from === payload && type === 'charge') return prevState;
				if (payload && prevState.from !== payload && type === 'charge') return { ...prevState, from: payload };
				if (type === 'reset') return { ...prevState, to: '' };
				if (type === 'process') setNextLocation({ pathname: prevState.to });
				if (!prevState.from && !prevState.to) return prevState;
				return { from: '', to: '' };
			}),
		[setNextLocation]
	);

	const updateLocation = useCallback(
		(nextLocation: Location) => {
			if (blockedRoute.from) {
				setBlockedRoute(prevState => ({ ...prevState, to: nextLocation.pathname }));
			} else {
				setNextLocation(nextLocation);
			}
		},
		[blockedRoute.from, setNextLocation]
	);

	useEffect(() => {
		const handler = (event: PopStateEvent) => {
			const newLocation = (event.target as Window).location;
			if (prevPathname.current === blockedRoute.from) {
				setBlockedRoute({ from: blockedRoute.from, to: newLocation.pathname });
				history.replaceState(null, '', prevPathname.current);
			} else {
				setNextLocation(parseWindowLocation(newLocation));
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRoute.from, setNextLocation]);

	const blockerState: BlockerState = useMemo(() => {
		if (blockedRoute.from && blockedRoute.to) return 'blocked';
		if (blockedRoute.from) return 'charged';
		return 'unblocked';
	}, [blockedRoute]);

	return { blockerState, updateLocation, updateBlockedRoute };
};
