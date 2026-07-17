import { useEffect } from 'react';
import { navigate } from '../runtime/navigate.ts';
import { useBlockedRoute } from '../state/state';
import { parseWindowLocation } from '../utils/utils';
import { prevPathnameRef } from '../cell';

export const useNavigation = () => {
	const [blockedRoute, setBlockedRoute] = useBlockedRoute();

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			if (prevPathnameRef.value === blockedRoute.from) {
				setBlockedRoute({ from: prevPathnameRef.value, to: newLocation.pathname });
				history.pushState(null, '', prevPathnameRef.value);
			} else {
				navigate(newLocation);
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRoute.from, setBlockedRoute]);

	useEffect(() => {
		const currentLocation = parseWindowLocation(window.location);
		navigate(currentLocation);
		prevPathnameRef.set(currentLocation.pathname);
	}, []);
};
