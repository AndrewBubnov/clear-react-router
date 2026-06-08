import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { BlockerState, Location, UpdateBlockedRouteProps } from '../types.ts';
import { parseWindowLocation } from '../utils.ts';

type BlockedRoute = { from: string; to: string };

export const useBlockNavigation = (setLocation: (arg: Location) => void) => {
	const [blockedRoute, setBlockedRoute] = useState<BlockedRoute>({ from: '', to: '' });

	const prevPathname = useRef<string>('');

	const setNextLocation = useCallback(
		(nextLocation: Location) => {
			setLocation(nextLocation);
			history.pushState(null, '', nextLocation.pathname);
			prevPathname.current = nextLocation.pathname;
		},
		[setLocation]
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
