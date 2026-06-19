import { useCallback } from 'react';
import { useRouterActions } from './useServiceContext';
import { useLocation } from './useLocation';
import type { Location } from '../types/global';

export const useNavigate = () => {
	const { updateLocation } = useRouterActions();
	const location = useLocation();

	return useCallback(
		async (arg: Location | string | number) => {
			if (typeof arg === 'number') return history.go(arg);
			if (typeof arg === 'string') {
				if (arg !== location.pathname) await updateLocation({ pathname: arg });
			} else if (JSON.stringify(arg) !== JSON.stringify(location)) {
				await updateLocation(arg);
			}
		},
		[location, updateLocation]
	);
};
