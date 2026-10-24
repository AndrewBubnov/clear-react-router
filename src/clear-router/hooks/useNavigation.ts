import { useEffect, useRef } from 'react';
import { router } from '../instance';
import { parseWindowLocation } from '../utils/utils';

export const useNavigation = () => {
	const { navigate } = router.runtime;
	const { useRouteDataSelector, useBlockerState } = router.hooks;
	const location = useRouteDataSelector(state => state.location);
	const skipForwardPop = useRef(false);

	const [blockerState] = useBlockerState();

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			const prevLocation = { pathname: location.pathname, search: location.search };

			if (skipForwardPop.current) {
				skipForwardPop.current = false;
				const samePath =
					newLocation.pathname === location.pathname &&
					(newLocation.search ?? '') === (location.search ?? '');
				if (samePath) return;
			}

			if (blockerState === 'charged' || blockerState === 'blocked') {
				// pushState here creates a skippable entry in Chrome; forward() only traverses.
				skipForwardPop.current = true;
				if (blockerState === 'charged') await navigate({ ...newLocation, prevLocation });
				history.forward();
				return;
			}

			await navigate({ ...newLocation, prevLocation });
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockerState, location.pathname, location.search, location.state, navigate]);

	useEffect(() => {
		navigate(parseWindowLocation(window.location));
	}, [navigate]);
};
