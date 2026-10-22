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
			staleTime: item.staleTime,
			reason: item.reason,
			gcExpiresAt: item.gcExpiresAt,
			gcDuration: item.gcDuration,
			isLoading: loadingPromises.has(path),
		});
	}
	for (const path of loadingPromises.keys()) {
		if (loaderMap.has(path)) continue;
		entries.push({
			path,
			data: undefined,
			timestamp: Date.now(),
			staleTime: undefined,
			gcExpiresAt: undefined,
			gcDuration: undefined,
			isLoading: true,
		});
	}
	return entries;
};
