import { useCallback } from 'react';
import { useServiceContext } from './useServiceContext.ts';
import type { Location } from '../types.ts';

export const useNavigate = () => {
	const { updateLocation } = useServiceContext('useNavigate');

	return useCallback(
		(arg: Location | -1) => {
			if (arg === -1) return history.go(-1);
			updateLocation(arg);
		},
		[updateLocation]
	);
};
