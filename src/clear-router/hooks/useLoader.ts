import { useCallback, useRef, useState } from 'react';
import { comparePaths } from '../utils/utils.ts';
import type { RouteItem } from '../types/global.ts';

export const useLoader = (routeList: RouteItem[]) => {
	const [loaderCache, setLoaderCache] = useState<Record<string, unknown>>({});
	const [loaderError, setLoaderError] = useState<boolean>(false);
	const [isLoadingMap, setIsLoadingMap] = useState<Record<string, boolean>>({});
	const cacheTimestampsRef = useRef<Record<string, number>>({});

	const updateCache = useCallback(
		({ key, value }: { key: string; value: unknown }) =>
			setLoaderCache(prevState => ({
				...prevState,
				[key]: value,
			})),
		[]
	);

	const isCacheItemFresh = useCallback((routeItem?: RouteItem) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = cacheTimestampsRef.current[routeItem.path];
		return Boolean(currentCacheTimestamp && Date.now() - currentCacheTimestamp < (routeItem.staleTime || 0));
	}, []);

	const revalidateCache = useCallback(
		async (routeItem?: RouteItem) => {
			if (!routeItem?.loader) return;
			if (isCacheItemFresh(routeItem)) return;
			setIsLoadingMap(prev => ({ ...prev, [routeItem.path]: true }));
			setLoaderCache(prevState =>
				Object.keys(prevState)
					.filter(el => el !== routeItem.path)
					.reduce((acc, cur) => ({ ...acc, [cur]: prevState[cur] }), {})
			);
			try {
				setLoaderError(false);
				const result = await routeItem?.loader();
				cacheTimestampsRef.current = { ...cacheTimestampsRef.current, [routeItem.path]: Date.now() };
				updateCache({ key: routeItem.path, value: result });
			} catch {
				setLoaderError(true);
			} finally {
				setIsLoadingMap(prev => ({ ...prev, [routeItem.path]: false }));
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

	return {
		loaderCache: loaderCache[window.location.pathname],
		loaderError,
		prefetchLoader,
		revalidateCache,
		isLoading: isLoadingMap[window.location.pathname],
	};
};
