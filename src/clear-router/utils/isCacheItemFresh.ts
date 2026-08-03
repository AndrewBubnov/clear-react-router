import type { RouteItem } from '../types';
import { routerConfig } from '../config/routerConfig';

export const createIsCacheItemFresh =
	(timestampMap: Map<string, number>) =>
	({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
		if (!routeItem) return true;
		const timestamp = timestampMap.get(pathname);
		if (timestamp === undefined) return false;
		const staleTime = routeItem.staleTime ?? routerConfig.defaultStaleTime;
		if (staleTime === undefined) return true;
		return Date.now() - timestamp <= staleTime;
	};
