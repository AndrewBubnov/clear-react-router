import { useCallback } from 'react';
import { useRouterActions } from './useServiceContext';
import type { Location } from '../types/global.ts';

export const useNavigate = () => {
	const { updateLocation } = useRouterActions();

	return useCallback(
		async (arg: Location | -1) => (arg === -1 ? history.go(-1) : await updateLocation(arg)),
		[updateLocation]
	);
};
