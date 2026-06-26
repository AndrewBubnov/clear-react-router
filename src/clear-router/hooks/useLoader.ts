import { type Dispatch, type SetStateAction, useCallback, useRef, useState } from 'react';
import { comparePaths, getParamsObject } from '../utils/utils';
import type { LoaderState, RevalidateCacheArgs, RouteItem } from '../types/global';

type UseLoaderParams = {
	routeList: RouteItem[];
	context: Record<string, unknown>;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	setLoaderState: Dispatch<SetStateAction<LoaderState>>;
};

export const useLoader = ({ routeList, context, setContext, setLoaderState }: UseLoaderParams) => {
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const cacheTimestampsRef = useRef<Record<string, number>>({});

	const isCacheItemFresh = useCallback(({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = cacheTimestampsRef.current[pathname];
		if (!currentCacheTimestamp) return false;
		if (!routeItem.staleTime) return true;
		return Date.now() - currentCacheTimestamp < routeItem.staleTime;
	}, []);

	const revalidateCache = useCallback(
		async ({ routeItem, isCurrentRoute, pathname }: RevalidateCacheArgs) => {
			if (!routeItem?.loader) return;

			if (isCacheItemFresh({ routeItem, pathname })) return;

			if (isCurrentRoute) setIsLoading(true);
			try {
				const params: Record<string, string> = getParamsObject({ routeItem, pathname });
				const result = await routeItem?.loader({
					params,
					context,
					setContext,
				});
				cacheTimestampsRef.current = { ...cacheTimestampsRef.current, [pathname]: Date.now() };
				if (isCurrentRoute) {
					setLoaderState(prevState => ({
						...prevState,
						[pathname]: { ...prevState[pathname], data: result, loaderError: null },
					}));
				}
			} catch (error) {
				if (isCurrentRoute) {
					setLoaderState(prevState => ({
						...prevState,
						[pathname]: { ...prevState[pathname], data: null, loaderError: error as Error },
					}));
				}
			} finally {
				setTimeout(() => setIsLoading(false), 10);
			}
		},
		[context, isCacheItemFresh, setContext, setLoaderState]
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
	};
};
