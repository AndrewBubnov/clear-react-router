import { useCallback, useRef, useState } from 'react';
import { comparePaths } from '../utils/utils.ts';
import type { RouteItem } from '../types/global.ts';

export const useLoader = (routeList: RouteItem[]) => {
	const [loaderCache, setLoaderCache] = useState<unknown>();
	const [loaderError, setLoaderError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const cacheTimestampsRef = useRef<Record<string, number>>({});
	const loaderCacheRef = useRef<Record<string, unknown>>({});

	const isCacheItemFresh = useCallback((routeItem?: RouteItem) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = cacheTimestampsRef.current[window.location.pathname];
		return Boolean(currentCacheTimestamp && Date.now() - currentCacheTimestamp < (routeItem.staleTime || 0));
	}, []);

	const revalidateCache = useCallback(
		async (routeItem?: RouteItem, isCurrentRoute?: boolean) => {
			if (!routeItem?.loader) return;
			const { pathname } = window.location;
			if (isCacheItemFresh(routeItem) && isCurrentRoute) setLoaderCache(loaderCacheRef.current[pathname]);
			if (isCacheItemFresh(routeItem)) return;

			if (isCurrentRoute) setIsLoading(true);
			loaderCacheRef.current = Object.keys(loaderCacheRef.current)
				.filter(el => el !== pathname)
				.reduce((acc, cur) => ({ ...acc, [cur]: loaderCacheRef.current[cur] }), {});
			try {
				if (isCurrentRoute) setLoaderError(false);
				const result = await routeItem?.loader();
				cacheTimestampsRef.current = { ...cacheTimestampsRef.current, [pathname]: Date.now() };
				loaderCacheRef.current = { ...loaderCacheRef.current, [pathname]: result };
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
