import { getParamsObject, sleep } from './utils';
import { createIsCacheItemFresh } from './isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { Retry, RevalidateCacheArgs, RouteItem, RouterState } from '../types';

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

export const createRevalidateCache = (routerState: RouterState) => {
	const { loaderStateRef, contextState, loaderMap, loadingPromises } = routerState;
	const removeStaleItems = () => {
		const deletedItems = [...loaderMap.entries()].filter(([, item]) => {
			const staleTime = item.staleTime ?? routerConfig.defaultStaleTime;
			return staleTime && staleTime + item.timestamp < Date.now();
		});
		if (deletedItems.length) deletedItems.forEach(item => loaderMap.delete(item[0]));
	};
	const evict = () => {
		if (loaderMap.size <= routerConfig.maxCacheSize) return;
		const oldestKey = loaderMap.keys().next().value;
		if (oldestKey) loaderMap.delete(oldestKey);
	};
	const moveItemToLastPosition = (path: string) => {
		const item = loaderMap.get(path);
		if (item) {
			loaderMap.delete(path);
			loaderMap.set(path, item);
		}
		return item;
	};
	const revalidateCache = async ({ routeItem, pathname, search = '', signal }: RevalidateCacheArgs, retried = 0) => {
		if (!routeItem?.loader) return;

		const isCacheItemFresh = createIsCacheItemFresh(loaderMap);

		removeStaleItems();

		const path = `${pathname}${search}`;

		if (loadingPromises.has(path)) {
			// NB: if this in-flight promise originated from a prefetch (no signal),
			// a subsequent navigation's AbortSignal is discarded here — the prefetch
			// request will complete regardless of later navigation changes.
			moveItemToLastPosition(path);
			return loadingPromises.get(path);
		}

		if (isCacheItemFresh(path)) {
			const item = moveItemToLastPosition(path);
			if (item?.state) loaderStateRef.set(item.state);
			return;
		}

		const promise = (async () => {
			if (!routeItem?.loader) return;
			const effectiveSignal = signal ?? new AbortController().signal;
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
					signal: effectiveSignal,
				});
				loaderStateRef.set(prev => ({ ...prev, data: result, loaderError: null }));
				loaderMap.set(path, {
					state: loaderStateRef.value,
					timestamp: Date.now(),
					staleTime: routeItem.staleTime,
				});
				evict();
				return { data: result, error: null };
			} catch (error) {
				if (effectiveSignal.aborted) return { data: null, error: null };
				const retry = getRetry(routeItem);
				if (retry && retry.count > retried) {
					loadingPromises.delete(path);
					if (retry.delay) await sleep(retry.delay);
					await revalidateCache({ routeItem, pathname, search, signal }, retried + 1);
					return { data: null, error };
				} else {
					loaderStateRef.set(prev => ({ ...prev, data: null, loaderError: error as Error }));
					return { data: null, error };
				}
			} finally {
				loadingPromises.delete(path);
			}
		})();

		loadingPromises.set(path, promise);
		return promise;
	};
	return revalidateCache;
};
