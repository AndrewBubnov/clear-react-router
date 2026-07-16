import type { RouteItem } from '../types/global';

export const timestampMap: Map<string, number> = new Map();

export const isCacheItemFresh = ({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
	if (!routeItem) return true;
	const currentCacheTimestamp = timestampMap.get(pathname);
	if (!currentCacheTimestamp) return false;
	if (!routeItem.staleTime) return true;
	return Date.now() - currentCacheTimestamp < routeItem.staleTime;
};
