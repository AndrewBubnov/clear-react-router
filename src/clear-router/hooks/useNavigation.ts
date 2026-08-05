import { useEffect } from 'react';
import { router } from '../instance';
import { parseWindowLocation } from '../utils/utils';

export const useNavigation = () => {
	const {
		state: { routeItemDataState, blockedRouteState },
		runtime: { navigate },
	} = router;

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			if (routeItemDataState.getState().location.pathname === blockedRouteState.getState().from) {
				blockedRouteState.setState({
					from: routeItemDataState.getState().location.pathname,
					to: newLocation.pathname,
				});
				history.pushState(null, '', routeItemDataState.getState().location.pathname);
			} else {
				navigate(newLocation);
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRouteState, navigate, routeItemDataState]);

	useEffect(() => {
		navigate(parseWindowLocation(window.location));
	}, [navigate]);
};
