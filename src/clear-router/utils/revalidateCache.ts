import { getParamsObject } from './utils';
import { createIsCacheItemFresh } from './isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { LoaderState, Retry, RevalidateCacheArgs, RouteItem, RouterState } from '../types';

const loaderMapRef: Record<string, LoaderState> = {};
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
	const { loaderStateRef, timestampMap, contextState } = routerState;
	const revalidateCache = async ({ routeItem, pathname }: RevalidateCacheArgs, retried = 0) => {
		if (!routeItem?.loader) return;

		const isCacheItemFresh = createIsCacheItemFresh(timestampMap);

		if (loadingPromises.has(pathname)) return loadingPromises.get(pathname);

		if (isCacheItemFresh({ routeItem, pathname })) {
			loaderStateRef.set(loaderMapRef[pathname]);
			return;
		}

		const promise = (async () => {
			if (!routeItem?.loader) return;
			try {
				const context = contextState.getState();
				const setContext = contextState.setState;
				const params: Record<string, string> = getParamsObject(routeItem, pathname);
				const result = await routeItem?.loader({
					params,
					context,
					setContext,
				});
				timestampMap.set(pathname, Date.now());
				loaderStateRef.set(prev => ({ ...prev, data: result, loaderError: null }));
				loaderMapRef[pathname] = loaderStateRef.value;
				return result;
			} catch (error) {
				const retry = getRetry(routeItem);
				if (retry && retry.count > retried) {
					loadingPromises.delete(pathname);
					if (retry.delay) await sleep(retry.delay);
					await revalidateCache({ routeItem, pathname }, retried + 1);
				} else {
					loaderStateRef.set(prev => ({ ...prev, data: null, loaderError: error as Error }));
				}
			} finally {
				loadingPromises.delete(pathname);
			}
		})();

		loadingPromises.set(pathname, promise);
		return promise;
	};
	return revalidateCache;
};
