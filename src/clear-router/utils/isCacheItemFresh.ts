import { routerConfig } from '../config/routerConfig';
import { LoaderStateItem } from '../types';

export const createIsCacheItemFresh = (loaderMap: Map<string, LoaderStateItem>) => (path: string) => {
	const item = loaderMap.get(path);
	if (item === undefined) return false;
	const resolvedStaleTime = item.staleTime ?? routerConfig.defaultStaleTime ?? 0;
	if (resolvedStaleTime <= 0) return false;
	return Date.now() - item.timestamp <= resolvedStaleTime;
};
