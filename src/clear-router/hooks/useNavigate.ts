import { useCallback } from 'react';
import { router } from '../instance';
import { useLocation } from './useLocation';
import { useLatest } from './useLatest';
import type { Location } from '../types';

export const useNavigate = () => {
	const [blockedRoute, setBlockedRoute] = router.hooks.useBlockedRoute();

	const location = useLocation();

	const locationRef = useLatest(location);
	const blockedRouteRef = useLatest(blockedRoute);

	return useCallback(
		async (arg: Location | string | -1) => {
			if (arg !== -1 && blockedRouteRef.current.from) {
				const to = typeof arg === 'object' ? arg.pathname : arg;
				setBlockedRoute(prevState => ({ ...prevState, to }));
				return;
			}
			if (arg === -1) return history.go(arg);
			if (typeof arg === 'string') {
				if (arg !== locationRef.current.pathname) await router.runtime.navigate({ pathname: arg });
			} else if (JSON.stringify(arg) !== JSON.stringify(locationRef.current)) {
				await router.runtime.navigate(arg);
			}
		},
		[blockedRouteRef, locationRef, setBlockedRoute]
	);
};
