import { useCallback, useEffect } from 'react';
import { router } from '../instance';

export const usePreserveScroll = (preserveScroll: boolean) => {
	const { useRouteItemData, useScrollMap } = router.hooks;

	const [routeItemData] = useRouteItemData();
	const [scrollMap] = useScrollMap();

	const { pathname } = routeItemData.location;

	const restoreScroll = useCallback(() => {
		if (!pathname || !scrollMap[pathname]) return;
		requestAnimationFrame(() => {
			window.scrollTo({ top: scrollMap[pathname], behavior: 'smooth' });
		});
	}, [pathname, scrollMap]);

	useEffect(() => {
		if (preserveScroll) restoreScroll();
	}, [preserveScroll, restoreScroll, pathname]);
};
