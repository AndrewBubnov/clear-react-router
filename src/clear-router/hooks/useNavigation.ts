import { useEffect } from 'react';
import { parseWindowLocation } from '../utils/utils';
import { RouterType } from '../types/global';

export const useNavigation = ({ state: { prevPathnameRef, blockedRouteState }, runtime: { navigate } }: RouterType) => {
	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			if (prevPathnameRef.value === blockedRouteState.getState().from) {
				blockedRouteState.setState({ from: prevPathnameRef.value, to: newLocation.pathname });
				history.pushState(null, '', prevPathnameRef.value);
			} else {
				navigate(newLocation);
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRouteState, navigate, prevPathnameRef.value]);

	useEffect(() => {
		const currentLocation = parseWindowLocation(window.location);
		navigate(currentLocation);
		prevPathnameRef.set(currentLocation.pathname);
	}, [navigate, prevPathnameRef]);
};
