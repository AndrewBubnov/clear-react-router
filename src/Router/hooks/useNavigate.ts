import { useCallback, useEffect } from 'react';
import { useRouterContext } from './useRouterContext.ts';
import type { Location } from '../types.ts';

export const useNavigate = () => {
	const { updateLocation, location } = useRouterContext('useNavigate');

	useEffect(() => history.pushState(null, '', location.pathname), [location.pathname]);

	return useCallback(
		(arg: Location | -1) => {
			if (arg === -1) return history.go(-1);
			updateLocation(arg);
		},
		[updateLocation]
	);
};
