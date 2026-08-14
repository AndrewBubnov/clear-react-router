import { routerConfig } from '../config/routerConfig';
import { LoaderStateItem } from '../types';

export const createIsCacheItemFresh = (loaderMap: Map<string, LoaderStateItem>) => (path: string) => {
	const item = loaderMap.get(path);
	if (item === undefined) return false;
	const resolvedStaleTime = item.staleTime ?? routerConfig.defaultStaleTime;
	if (resolvedStaleTime === undefined) return true;
	return Date.now() - item.timestamp <= resolvedStaleTime;
};
