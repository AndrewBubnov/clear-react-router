import { useEffect } from 'react';
import { router } from '../instance';
import { parseWindowLocation } from '../utils/utils';

export const useNavigation = () => {
	const { navigate } = router.runtime;
	const { useRouteItemData, useBlockerState } = router.hooks;
	const [{ location }] = useRouteItemData();
	const [blockerState] = useBlockerState();

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			const prevLocation = { pathname: location.pathname, search: location.search };
			if (blockerState === 'charged') {
				history.pushState(null, '', location.pathname);
			}
			await navigate({ ...newLocation, prevLocation });
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockerState, location.pathname, location.search, navigate]);

	useEffect(() => {
		navigate(parseWindowLocation(window.location));
	}, [navigate]);
};
