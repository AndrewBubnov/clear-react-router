import { routerConfig } from '../config/routerConfig';
import { LoaderStateItem } from '../types';

export const createIsCacheItemFresh =
	(loaderMap: Map<string, LoaderStateItem>) => (pathname: string, search?: string) => {
		const item = loaderMap.get(`${pathname}${search}`);
		if (item === undefined) return false;
		const resolvedStaleTime = item.staleTime ?? routerConfig.defaultStaleTime;
		if (resolvedStaleTime === undefined) return true;
		return Date.now() - item.timestamp <= resolvedStaleTime;
	};
