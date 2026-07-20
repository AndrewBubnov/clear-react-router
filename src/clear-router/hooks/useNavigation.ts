import { useEffect } from 'react';
import { useRouter } from './useRouter';
import { parseWindowLocation } from '../utils/utils';

export const useNavigation = () => {
	const {
		state: { prevPathnameRef, blockedRouteState },
		runtime: { navigate },
	} = useRouter();
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
