import { useCallback } from 'react';
import { useBlockedRoute } from '../state/state';
import { useRouterCallback } from './useRouterCallback';
import { useLocation } from './useLocation';
import { useLatest } from './useLatest';
import type { Location } from '../types/global';

export const useNavigate = () => {
	const [blockedRoute, setBlockedRoute] = useBlockedRoute();

	const { updateLocation } = useRouterCallback();
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
				if (arg !== locationRef.current.pathname) await updateLocation({ pathname: arg });
			} else if (JSON.stringify(arg) !== JSON.stringify(locationRef.current)) {
				await updateLocation(arg);
			}
		},
		[blockedRouteRef, locationRef, setBlockedRoute, updateLocation]
	);
};
