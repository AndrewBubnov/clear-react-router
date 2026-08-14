import { routerConfig } from '../config/routerConfig';
import { LoaderStateItem, RouteItem } from '../types';

export const createIsCacheItemFresh =
	(loaderMap: Map<string, LoaderStateItem>) =>
	({ routeItem, pathname, search = '' }: { routeItem?: RouteItem; pathname: string; search?: string }) => {
		if (!routeItem) return true;
		const item = loaderMap.get(`${pathname}${search}`);
		if (item === undefined) return false;
		const staleTime = routeItem.staleTime ?? routerConfig.defaultStaleTime;
		if (staleTime === undefined) return true;
		return Date.now() - item.timestamp <= staleTime;
	};
