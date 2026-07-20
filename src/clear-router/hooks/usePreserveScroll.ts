import { useCallback, useEffect } from 'react';
import { useRouter } from './useRouter.ts';

export const usePreserveScroll = (preserveScroll: boolean) => {
	const {
		hooks: { useRouteItemData, useScrollMap },
	} = useRouter();

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
