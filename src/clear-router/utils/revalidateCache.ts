import { getParamsObject } from './utils';
import { createIsCacheItemFresh } from './isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { Retry, RevalidateCacheArgs, RouteItem, RouterState } from '../types';

const loadingPromises = new Map();

const isObjectRetry = (arg: Retry) => typeof arg === 'object';
const createRetry = (arg: Retry) => {
	if (arg === undefined) return null;
	return {
		count: isObjectRetry(arg) ? arg.count : arg,
		delay: isObjectRetry(arg) ? arg.delay : 0,
	};
};
const getRetry = (routeItem: RouteItem | undefined) => {
	const routeRetry = createRetry(routeItem?.retry);
	const globalRetry = createRetry(routerConfig.defaultRetry);
	if (!routeRetry && !globalRetry) return null;
	return {
		count: routeRetry ? routeRetry.count : globalRetry?.count || 0,
		delay: routeRetry ? routeRetry.delay : globalRetry?.delay || 0,
	};
};
const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const createRevalidateCache = (routerState: RouterState) => {
	const { loaderStateRef, contextState, loaderMap } = routerState;
	const revalidateCache = async ({ routeItem, pathname, search = '' }: RevalidateCacheArgs, retried = 0) => {
		if (!routeItem?.loader) return;

		const isCacheItemFresh = createIsCacheItemFresh(loaderMap);

		if (loadingPromises.has(pathname)) return loadingPromises.get(pathname);

		if (isCacheItemFresh({ routeItem, pathname, search })) {
			const item = loaderMap.get(pathname);
			if (item?.state) loaderStateRef.set(item.state);
			return;
		}

		const promise = (async () => {
			if (!routeItem?.loader) return;

			try {
				const context = contextState.getState();
				const setContext = contextState.setState;
				const params: Record<string, string> = getParamsObject(routeItem, pathname);
				const searchParams: Record<string, string> = Object.fromEntries(new URLSearchParams(search).entries());
				const result = await routeItem?.loader({
					params,
					context,
					setContext,
					searchParams,
				});
				loaderStateRef.set(prev => ({ ...prev, data: result, loaderError: null }));
				const deletedItem = [...loaderMap.entries()].find(([, item]) => {
					const staleTime = item.staleTime ?? routerConfig.defaultStaleTime;
					return staleTime && staleTime + item.timestamp < Date.now();
				});
				if (deletedItem) loaderMap.delete(deletedItem[0]);
				loaderMap.set(`${pathname}${search}`, {
					state: loaderStateRef.value,
					timestamp: Date.now(),
					staleTime: routeItem.staleTime,
				});
				return { data: result, error: null };
			} catch (error) {
				const retry = getRetry(routeItem);
				if (retry && retry.count > retried) {
					loadingPromises.delete(`${pathname}${search}`);
					if (retry.delay) await sleep(retry.delay);
					await revalidateCache({ routeItem, pathname, search }, retried + 1);
					return { data: null, error };
				} else {
					loaderStateRef.set(prev => ({ ...prev, data: null, loaderError: error as Error }));
					return { data: null, error };
				}
			} finally {
				loadingPromises.delete(`${pathname}${search}`);
			}
		})();

		loadingPromises.set(`${pathname}${search}`, promise);
		return promise;
	};
	return revalidateCache;
};
