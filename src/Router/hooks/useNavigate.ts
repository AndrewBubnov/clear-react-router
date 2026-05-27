import { useCallback } from 'react';
import { useRouterContext } from './useRouterContext.ts';
import type { Location } from '../types.ts';

export const useNavigate = () => {
	const { setLocation } = useRouterContext('useNavigate');

	return useCallback(
		(arg: Location | -1) => {
			if (arg === -1) return history.go(-1);
			setLocation(arg);
			history.pushState(null, '', arg.pathname);
		},
		[setLocation]
	);
};
