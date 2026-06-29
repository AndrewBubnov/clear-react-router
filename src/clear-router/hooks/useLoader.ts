import { type Dispatch, type SetStateAction, useCallback, useRef, useState } from 'react';
import { comparePaths, getParamsObject } from '../utils/utils';
import type { LoaderState, RevalidateCacheArgs, RouteItem } from '../types/global';

type UseLoaderParams = {
	routeList: RouteItem[];
	context: Record<string, unknown>;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
};

export const useLoader = ({ routeList, context, setContext }: UseLoaderParams) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const cacheTimestampsRef = useRef<Record<string, number>>({});
	const loaderCacheRef = useRef<Record<string, LoaderState>>({});

	const isCacheItemFresh = useCallback(({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = cacheTimestampsRef.current[pathname];
		if (!currentCacheTimestamp) return false;
		if (!routeItem.staleTime) return true;
		return Date.now() - currentCacheTimestamp < routeItem.staleTime;
	}, []);

	const revalidateCache = useCallback(
		async ({ routeItem, loaderState, pathname }: RevalidateCacheArgs) => {
			if (!routeItem?.loader) {
				if (loaderState) loaderState.current = {} as LoaderState;
				return;
			}

			if (isCacheItemFresh({ routeItem, pathname })) {
				if (loaderState) loaderState.current = loaderCacheRef.current[pathname];
				return;
			}

			if (loaderState) setIsLoading(true);

			try {
				const params: Record<string, string> = getParamsObject({ params: routeItem.params, pathname });
				const result = await routeItem?.loader({
					params,
					context,
					setContext,
				});
				cacheTimestampsRef.current = { ...cacheTimestampsRef.current, [pathname]: Date.now() };
				loaderCacheRef.current[pathname] = { data: result, loaderError: null, beforeLoadError: null };
				if (loaderState) {
					loaderState.current = { ...loaderState?.current, data: result, loaderError: null };
				}
			} catch (error) {
				if (loaderState) {
					loaderState.current = { ...loaderState?.current, data: null, loaderError: error as Error };
				}
			}
		},
		[context, isCacheItemFresh, setContext]
	);

	const prefetchLoader = useCallback(
		async (pathname: string) => {
			const item = routeList.find(el => comparePaths(el, pathname));
			if (item) await revalidateCache({ routeItem: item, pathname });
		},
		[revalidateCache, routeList]
	);

	return {
		prefetchLoader,
		revalidateCache,
		isLoading,
		setIsLoading,
	};
};
