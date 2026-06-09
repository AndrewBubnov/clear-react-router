import { useCallback } from 'react';
import { useRouterActions } from './useServiceContext.ts';
import type { Location } from '../types/global.ts';

export const useNavigate = () => {
	const { updateLocation } = useRouterActions();

	return useCallback(
		async (arg: Location | -1) => {
			if (arg === -1) return history.go(-1);
			await updateLocation(arg);
		},
		[updateLocation]
	);
};
