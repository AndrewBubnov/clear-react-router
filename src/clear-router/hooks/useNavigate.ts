import { useCallback } from 'react';
import { useRouterActions } from './useServiceContext';
import { useLocation } from './useLocation';
import type { Location } from '../types/global';
import { useLatest } from './useLatest.ts';

export const useNavigate = () => {
	const { updateLocation } = useRouterActions();
	const location = useLocation();

	const locationRef = useLatest(location);

	return useCallback(
		async (arg: Location | string | number) => {
			if (typeof arg === 'number') return history.go(arg);
			if (typeof arg === 'string') {
				if (arg !== locationRef.current.pathname) await updateLocation({ pathname: arg });
			} else if (JSON.stringify(arg) !== JSON.stringify(locationRef.current)) {
				await updateLocation(arg);
			}
		},
		[updateLocation, locationRef]
	);
};
