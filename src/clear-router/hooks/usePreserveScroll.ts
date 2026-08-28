import { useEffect } from 'react';
import { router } from '../instance';
import { RouteItemData } from '../types';

export const usePreserveScroll = ({ routeItem }: RouteItemData) => {
	const restoreScroll = router.hooks.useRestoreScroll();
	useEffect(() => {
		if (routeItem?.preserveScroll === false) return;
		restoreScroll();
	}, [restoreScroll, routeItem?.preserveScroll]);
};
