import { useCallback, useState } from 'react';
import { comparePaths } from '../utils/utils.ts';
import type { RouteItem } from '../types/global.ts';

export const useLoader = (routeList: RouteItem[]) => {
	const [loaderCache, setLoaderCache] = useState<Record<string, unknown>>({});
	const [cacheTimestamps, setCacheTimestamps] = useState<Record<string, number>>({});
	const [loaderError, setLoaderError] = useState<boolean>(false);

	const updateCache = useCallback(
		({ key, value }: { key: string; value: unknown }) =>
			setLoaderCache(prevState => ({
				...prevState,
				[key]: value,
			})),
		[]
	);

	const isCacheItemFresh = useCallback(
		(routeItem?: RouteItem) => {
			if (!routeItem) return true;
			const currentCacheTimestamp = cacheTimestamps[routeItem.path];
			return Boolean(currentCacheTimestamp && Date.now() - currentCacheTimestamp < (routeItem.staleTime || 0));
		},
		[cacheTimestamps]
	);

	const revalidateCache = useCallback(
		async (routeItem?: RouteItem) => {
			if (!routeItem?.loader) return;
			if (isCacheItemFresh(routeItem)) return;

			setLoaderCache(prevState =>
				Object.keys(prevState)
					.filter(el => el !== routeItem.path)
					.reduce((acc, cur) => ({ ...acc, [cur]: prevState[cur] }), {})
			);
			try {
				setLoaderError(false);
				const result = await routeItem?.loader();
				setCacheTimestamps(prevState => ({
					...prevState,
					[routeItem.path]: Date.now(),
				}));
				updateCache({ key: routeItem.path, value: result });
			} catch {
				setLoaderError(true);
			}
		},
		[isCacheItemFresh, updateCache]
	);

	const prefetchLoader = useCallback(
		async (pathname: string) => {
			const item = routeList.find(el => comparePaths(el, pathname));
			if (item) await revalidateCache(item);
		},
		[revalidateCache, routeList]
	);

	return { loaderCache, loaderError, prefetchLoader, revalidateCache };
};
