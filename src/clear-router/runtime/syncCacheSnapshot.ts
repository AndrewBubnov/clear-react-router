import { routerConfig } from '../config/routerConfig';
import { CacheSnapshot, LoaderStateItem, LoadingPromise } from '../types';

export const createCacheSnapshot = (
	loaderMap: Map<string, LoaderStateItem>,
	loadingPromises: Map<string, LoadingPromise>
) => {
	const entries: CacheSnapshot = [];
	for (const [path, item] of loaderMap) {
		entries.push({
			path,
			data: item.state?.data,
			timestamp: item.timestamp,
			staleTime: item.staleTime ?? routerConfig.defaultStaleTime ?? 0,
			reason: item.reason,
			gcExpiresAt: item.gcExpiresAt,
			gcDuration: item.gcDuration,
			isCached: true,
			isLoading: loadingPromises.has(path),
		});
	}
	for (const path of loadingPromises.keys()) {
		if (loaderMap.has(path)) continue;
		entries.push({
			path,
			data: undefined,
			timestamp: Date.now(),
			staleTime: routerConfig.defaultStaleTime ?? 0,
			gcExpiresAt: undefined,
			gcDuration: undefined,
			isCached: false,
			isLoading: true,
		});
	}
	return entries;
};
