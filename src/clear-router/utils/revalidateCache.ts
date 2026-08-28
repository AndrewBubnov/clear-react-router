import { createIsCacheItemFresh } from './isCacheItemFresh';
import { getPartialLoaderArgs, sleep } from './utils';
import { routerConfig } from '../config/routerConfig';
import { LoadingPromise, Retry, RevalidateCacheArgs, RouteItem, RouterState } from '../types';

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
	const { loaderMap, loadingPromises } = routerState;
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
	const revalidateCache = async (
		{ routeItem, location, signal }: RevalidateCacheArgs,
		retried = 0
	): LoadingPromise => {
		if (!routeItem?.loader) return;

		const isCacheItemFresh = createIsCacheItemFresh(loaderMap);

		const { pathname, search = '' } = location;
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
			if (!item?.state) return undefined;
			return item.state.loaderError
				? { data: null, error: item.state.loaderError }
				: { data: item.state.data, error: null };
		}

		const promise = (async (): LoadingPromise => {
			if (!routeItem?.loader) return;
			const effectiveSignal = signal ?? new AbortController().signal;
			try {
				const result = await routeItem?.loader({ ...getPartialLoaderArgs(location), signal: effectiveSignal });
				loaderMap.set(path, {
					state: { data: result, beforeLoadError: null, loaderError: null },
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
					await revalidateCache({ routeItem, location, signal }, retried + 1);
					return { data: null, error };
				} else {
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
