import { type Dispatch, type SetStateAction, useCallback, useRef } from 'react';
import { comparePaths, getParamsObject } from '../utils/utils';
import { emptyLoaderState } from '../constants';
import type { LoaderState, RevalidateCacheArgs, RouteItem } from '../types/global';

type UseLoaderParams = {
	routeList: RouteItem[];
	context: Record<string, unknown>;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
};

export const useLoader = ({ routeList, context, setContext }: UseLoaderParams) => {
	const timestampMapRef = useRef<Map<string, number>>(new Map());
	const loaderMapRef = useRef<Record<string, LoaderState>>({});
	const loaderStateRef = useRef<LoaderState>(emptyLoaderState);
	const loadingPromises = useRef<Map<string, Promise<unknown>>>(new Map());

	const isCacheItemFresh = useCallback(({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => {
		if (!routeItem) return true;
		const currentCacheTimestamp = timestampMapRef.current.get(pathname);
		if (!currentCacheTimestamp) return false;
		if (!routeItem.staleTime) return true;
		return Date.now() - currentCacheTimestamp < routeItem.staleTime;
	}, []);

	const revalidateCache = useCallback(
		async ({ routeItem, pathname }: RevalidateCacheArgs) => {
			if (!routeItem?.loader) return;

			if (loadingPromises.current.has(pathname)) return loadingPromises.current.get(pathname);

			if (isCacheItemFresh({ routeItem, pathname })) {
				loaderStateRef.current = loaderMapRef.current[pathname];
				return;
			}

			const promise = (async () => {
				if (!routeItem?.loader) return;
				try {
					const params: Record<string, string> = getParamsObject({ params: routeItem.params, pathname });
					const result = await routeItem?.loader({
						params,
						context,
						setContext,
					});
					timestampMapRef.current.set(pathname, Date.now());
					loaderMapRef.current[pathname] = { data: result, loaderError: null, beforeLoadError: null };
					loaderStateRef.current = { ...loaderStateRef?.current, data: result, loaderError: null };
				} catch (error) {
					loaderStateRef.current = { ...loaderStateRef?.current, data: null, loaderError: error as Error };
				} finally {
					loadingPromises.current.delete(pathname);
				}
			})();

			loadingPromises.current.set(pathname, promise);
			return promise;
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

	const clearTimestamp = useCallback((pathname: string) => {
		timestampMapRef.current.delete(pathname);
	}, []);

	return { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef, clearTimestamp };
};
