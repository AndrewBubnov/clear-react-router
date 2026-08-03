import { useEffect } from 'react';
import { router } from '../instance';
import { routerConfig } from '../config/routerConfig';
import { RouteItemData } from '../types';

export const usePreserveScroll = ({ routeItem, location: { pathname } }: RouteItemData) => {
	const preserveScroll =
		routeItem?.preserveScroll === undefined ? routerConfig.defaultPreserveScroll : routeItem.preserveScroll;
	const restoreScroll = router.hooks.useRestoreScroll();
	useEffect(() => {
		if (preserveScroll) restoreScroll();
	}, [preserveScroll, restoreScroll, pathname]);
};
