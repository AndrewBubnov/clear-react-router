import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { comparePaths, parseWindowLocation } from '../utils/utils.ts';
import { Redirect } from '../utils/redirect.ts';
import type { BlockerState, Location, RouteItem, UpdateBlockedRouteProps } from '../types/global.ts';

type BlockedRoute = { from: string; to: string };

type UseHandleNavigation = {
	routeList: RouteItem[];
	setLocation: (arg: Location) => void;
	context: Record<string, unknown>;
	revalidateCache(routeItem?: RouteItem): Promise<void>;
};

export const useHandleNavigation = ({ setLocation, routeList, context, revalidateCache }: UseHandleNavigation) => {
	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });

	const prevPathname = useRef<string>('');

	const setNextLocation = useCallback(
		async (nextLocation: Location) => {
			try {
				const nextItem = routeList.find(el => comparePaths(el, nextLocation.pathname));
				if (nextItem?.beforeLoad) await nextItem?.beforeLoad(context);
				await revalidateCache(nextItem);
				setLocation(nextLocation);
				history.pushState(null, '', nextLocation.pathname);
				prevPathname.current = nextLocation.pathname;
				if (nextItem?.afterLoad) await nextItem?.afterLoad(context);
			} catch (redirect) {
				if (!(redirect instanceof Redirect)) return redirect;
				history.replaceState(null, '', `${redirect.url}${redirect.search || ''}`);
				setLocation({ pathname: redirect.url, search: redirect.search });
			}
		},
		[context, revalidateCache, routeList, setLocation]
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
		async (nextLocation: Location) => {
			if (blockedRoute.from) {
				setBlockedRoute(prevState => ({ ...prevState, to: nextLocation.pathname }));
			} else {
				await setNextLocation(nextLocation);
			}
		},
		[blockedRoute.from, setNextLocation]
	);

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = (event.target as Window).location;
			if (prevPathname.current === blockedRoute.from) {
				setBlockedRoute({ from: prevPathname.current, to: newLocation.pathname });
				history.pushState(null, '', prevPathname.current);
			} else {
				await setNextLocation(parseWindowLocation(newLocation));
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRoute.from, setNextLocation]);

	useEffect(() => {
		const currentLocation = parseWindowLocation(window.location);
		setNextLocation(currentLocation);
	}, [setNextLocation]);

	const blockerState: BlockerState = useMemo(() => {
		if (blockedRoute.from && blockedRoute.to) return 'blocked';
		if (blockedRoute.from) return 'charged';
		return 'unblocked';
	}, [blockedRoute]);

	return { blockerState, updateLocation, updateBlockedRoute };
};
