import { useEffect } from 'react';
import { router } from '../instance';
import { parseWindowLocation } from '../utils/utils';

export const useNavigation = () => {
	const { navigate } = router.runtime;
	const { blockerState, routeItemDataState } = router.state;

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			if (blockerState.getState() === 'charged') {
				history.pushState(null, '', routeItemDataState.getState().location.pathname);
			}
			await navigate(newLocation);
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [navigate, blockerState, routeItemDataState]);

	useEffect(() => {
		navigate(parseWindowLocation(window.location));
	}, [navigate]);
};
