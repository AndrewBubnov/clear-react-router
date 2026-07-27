import { useEffect } from 'react';
import { router } from '../instance';
import { useLocation } from './useLocation';

export const usePreserveScroll = (preserveScroll: boolean) => {
	const restoreScroll = router.hooks.useRestoreScroll();
	const { pathname } = useLocation();
	useEffect(() => {
		if (preserveScroll) restoreScroll();
	}, [preserveScroll, restoreScroll, pathname]);
};
