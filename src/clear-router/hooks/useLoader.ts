import { useCallback, useRef } from 'react';
import { useContextState, useCurrentLoaderState, useRouteItemData } from '../state/state';
import { comparePaths, getParamsObject } from '../utils/utils';
import { emptyLoaderState } from '../constants';
import type { LoaderState, RevalidateCacheArgs, RouteItem } from '../types/global';
import { useLatest } from './useLatest.ts';

export const useLoader = (routes: RouteItem[]) => {
	const [, setLoaderState] = useCurrentLoaderState();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const loaderStateRef = useRef<LoaderState>(emptyLoaderState);
	const latestPathname = useLatest(routeItemData.location.pathname);
	const timestampMapRef = useRef<Map<string, number>>(new Map());
	const loaderMapRef = useRef<Record<string, LoaderState>>({});
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
					loaderStateRef.current = { ...loaderStateRef?.current, data: result, loaderError: null };
					loaderMapRef.current[pathname] = loaderStateRef.current;
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
			const item = routes.find(el => comparePaths(el, pathname));
			if (item) await revalidateCache({ routeItem: item, pathname });
		},
		[revalidateCache, routes]
	);

	const invalidate = useCallback(
		async (pathname = latestPathname.current) => {
			if (typeof pathname !== 'string') return;
			const routeItem = routes.find(el => comparePaths(el, pathname));
			const resultParams = getParamsObject({
				params: routeItem?.params,
				pathname,
			});
			timestampMapRef.current.delete(pathname);
			try {
				if (routeItem?.beforeLoad) {
					await routeItem.beforeLoad({
						context,
						redirect: () => Promise.resolve(),
						params: resultParams,
						setContext,
					});
				}
				loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: null };
			} catch (error) {
				loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: error as Error };
			}

			await revalidateCache({ routeItem, pathname: pathname });
			if (pathname === latestPathname.current) setLoaderState(loaderStateRef.current);
		},
		[context, loaderStateRef, revalidateCache, latestPathname, routes, setContext, setLoaderState]
	);

	return { prefetchLoader, revalidateCache, isCacheItemFresh, loaderStateRef, invalidate };
};
