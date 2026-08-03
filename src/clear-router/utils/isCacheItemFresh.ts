import type { RouteItem } from '../types';
import { routerConfig } from '../config/routerConfig';

export const createIsCacheItemFresh =
	(timestampMap: Map<string, number>) =>
	({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
		if (!routeItem) return true;
		const { defaultStaleTime } = routerConfig;
		const currentCacheTimestamp = timestampMap.get(pathname);
		if (!currentCacheTimestamp) return false;
		if (!routeItem.staleTime && !defaultStaleTime) return true;
		const staleTime = routeItem.staleTime || defaultStaleTime;
		return Date.now() - currentCacheTimestamp <= (staleTime ?? 0);
	};
