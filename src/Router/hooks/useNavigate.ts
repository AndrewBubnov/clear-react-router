import { useCallback } from 'react';
import { useRouterContext } from './useRouterContext.ts';
import type { Location } from '../types.ts';

export const useNavigate = () => {
	const { updateLocation } = useRouterContext('useNavigate');

	return useCallback(
		(arg: Location | -1) => {
			if (arg === -1) return history.go(-1);
			updateLocation(arg);
		},
		[updateLocation]
	);
};
