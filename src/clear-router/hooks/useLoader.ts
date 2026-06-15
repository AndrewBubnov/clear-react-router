import { useCallback, useRef, useState } from 'react';
import { comparePaths } from '../utils/utils';
import type { RouteItem } from '../types/global.ts';

export const useLoader = (routeList: RouteItem[]) => {
	const [loaderCache, setLoaderCache] = useState<unknown>();
	const [loaderError, setLoaderError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const cacheTimestampsRef = useRef<Record<string, number>>({});
	const loaderCacheRef = useRef<Record<string, unknown>>({});

	const isCacheItemFresh = useCallback((routeItem?: RouteItem) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = cacheTimestampsRef.current[routeItem.path];
		return Boolean(currentCacheTimestamp && Date.now() - currentCacheTimestamp < (routeItem.staleTime || 0));
	}, []);

	const revalidateCache = useCallback(
		async (routeItem?: RouteItem, isCurrentRoute?: boolean) => {
			if (!routeItem?.loader) return;
			if (isCacheItemFresh(routeItem) && isCurrentRoute) setLoaderCache(loaderCacheRef.current[routeItem.path]);
			if (isCacheItemFresh(routeItem)) return;
			if (isCurrentRoute) setIsLoading(true);
			loaderCacheRef.current = Object.keys(loaderCacheRef.current)
				.filter(el => el !== routeItem.path)
				.reduce((acc, cur) => ({ ...acc, [cur]: loaderCacheRef.current[cur] }), {});
			try {
				if (isCurrentRoute) setLoaderError(false);
				const result = await routeItem?.loader();
				cacheTimestampsRef.current = { ...cacheTimestampsRef.current, [routeItem.path]: Date.now() };
				loaderCacheRef.current = { ...loaderCacheRef.current, [routeItem.path]: result };
				if (isCurrentRoute) setLoaderCache(result);
			} catch {
				if (isCurrentRoute) setLoaderError(true);
			} finally {
				if (isCurrentRoute) setIsLoading(false);
			}
		},
		[isCacheItemFresh]
	);

	const prefetchLoader = useCallback(
		async (pathname: string) => {
			const item = routeList.find(el => comparePaths(el, pathname));
			if (item) await revalidateCache(item);
		},
		[revalidateCache, routeList]
	);

	return {
		loaderCache,
		loaderError,
		prefetchLoader,
		revalidateCache,
		isLoading,
	};
};
