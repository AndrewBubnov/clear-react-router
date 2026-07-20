import { useCallback, useEffect } from 'react';
import { useRouteItemData, useScrollMap } from '../state/hooks.ts';
import { useRouter } from './useRouter.ts';

export const usePreserveScroll = (preserveScroll: boolean) => {
	const router = useRouter();

	const [routeItemData] = useRouteItemData(router);
	const [scrollMap] = useScrollMap(router);

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
