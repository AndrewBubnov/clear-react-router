import type { RouteItem } from '../types';

export const createIsCacheItemFresh =
	(timestampMap: Map<string, number>) =>
	({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = timestampMap.get(pathname);
		if (!currentCacheTimestamp) return false;
		if (!routeItem.staleTime) return true;
		return Date.now() - currentCacheTimestamp < routeItem.staleTime;
	};
