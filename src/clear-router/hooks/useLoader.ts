import { useCallback, useRef, useState } from 'react';
import { comparePaths, getParamsObject } from '../utils/utils.ts';
import type { RevalidateCacheArgs, RouteItem } from '../types/global.ts';

type UseLoaderParams = {
	routeList: RouteItem[];
	context: Record<string, unknown>;
};

export const useLoader = ({ routeList, context }: UseLoaderParams) => {
	const [loaderCache, setLoaderCache] = useState<unknown>();
	const [loaderError, setLoaderError] = useState<boolean>(false);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const cacheTimestampsRef = useRef<Record<string, number>>({});
	const loaderCacheRef = useRef<Record<string, unknown>>({});

	const isCacheItemFresh = useCallback(({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = cacheTimestampsRef.current[pathname];
		return Boolean(currentCacheTimestamp && Date.now() - currentCacheTimestamp < (routeItem.staleTime || 0));
	}, []);

	const revalidateCache = useCallback(
		async ({ routeItem, isCurrentRoute, pathname }: RevalidateCacheArgs) => {
			if (!routeItem?.loader) return;

			if (isCacheItemFresh({ routeItem, pathname }) && isCurrentRoute) {
				setLoaderCache(loaderCacheRef.current[pathname]);
			}
			if (isCacheItemFresh({ routeItem, pathname })) return;

			if (isCurrentRoute) setIsLoading(true);
			loaderCacheRef.current = Object.keys(loaderCacheRef.current)
				.filter(el => el !== routeItem.path)
				.reduce((acc, cur) => ({ ...acc, [cur]: loaderCacheRef.current[cur] }), {});
			try {
				if (isCurrentRoute) setLoaderError(false);
				const params: Record<string, string> = getParamsObject({ routeItem, pathname });
				const result = await routeItem?.loader({ params, context });
				cacheTimestampsRef.current = { ...cacheTimestampsRef.current, [pathname]: Date.now() };
				loaderCacheRef.current = { ...loaderCacheRef.current, [pathname]: result };
				if (isCurrentRoute) setLoaderCache(result);
			} catch {
				if (isCurrentRoute) setLoaderError(true);
			} finally {
				if (isCurrentRoute) setIsLoading(false);
			}
		},
		[context, isCacheItemFresh]
	);

	const prefetchLoader = useCallback(
		async (pathname: string) => {
			const item = routeList.find(el => comparePaths(el, pathname));
			if (item) await revalidateCache({ routeItem: item, pathname });
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
