import { useCallback } from 'react';
import { useBlockedRoute } from '../state/state';
import { useRouterActions } from './useServiceContext';
import { useLocation } from './useLocation';
import type { Location } from '../types/global';
import { useLatest } from './useLatest';

export const useNavigate = () => {
	const [blockedRoute, setBlockedRoute] = useBlockedRoute();

	const { updateLocation } = useRouterActions();
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
