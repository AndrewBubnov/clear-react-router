import { useCallback } from 'react';
import { useRouterActions } from './useServiceContext.ts';
import type { Location } from '../types/global.ts';
import { useLocation } from './useLocation.ts';

export const useNavigate = () => {
	const { updateLocation } = useRouterActions();
	const location = useLocation();

	return useCallback(
		async (arg: Location | string | -1) => {
			if (arg === -1) return history.go(-1);
			if (typeof arg === 'string') {
				if (arg !== location.pathname) await updateLocation({ pathname: arg });
			} else if (JSON.stringify(arg) !== JSON.stringify(location)) {
				await updateLocation(arg);
			}
		},
		[location, updateLocation]
	);
};
