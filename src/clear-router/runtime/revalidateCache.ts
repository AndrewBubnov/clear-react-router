import { createIsCacheItemFresh } from '../utils/isCacheItemFresh';
import { getPartialLoaderArgs, sleep } from '../utils/utils';
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
	const { loaderMap, loadingPromises, contextState } = routerState;
	const flightOwners = new Map<string, AbortController | AbortSignal>();
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
			const owner = flightOwners.get(path);
			if (signal && owner instanceof AbortController) {
				owner.abort();
				loadingPromises.delete(path);
				flightOwners.delete(path);
			} else {
				moveItemToLastPosition(path);
				return loadingPromises.get(path);
			}
		}

		if (isCacheItemFresh(path)) {
			const item = moveItemToLastPosition(path);
			if (!item?.state) return undefined;
			return item.state.loaderError
				? { data: null, error: item.state.loaderError }
				: { data: item.state.data, error: null };
		}

		const promise: LoadingPromise = (async (): LoadingPromise => {
			if (!routeItem?.loader) return;
			const prefetchController = signal ? null : new AbortController();
			const effectiveSignal = signal ?? prefetchController!.signal;
			const ownerToken: AbortController | AbortSignal = prefetchController ?? signal!;
			flightOwners.set(path, ownerToken);
			const isOwner = () => flightOwners.get(path) === ownerToken;
			try {
				const result = await routeItem?.loader({
					...getPartialLoaderArgs(contextState, location, routeItem),
					signal: effectiveSignal,
				});
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
					if (isOwner()) {
						loadingPromises.delete(path);
						flightOwners.delete(path);
					}
					if (retry.delay) await sleep(retry.delay);
					return revalidateCache({ routeItem, location, signal }, retried + 1);
				} else {
					return { data: null, error };
				}
			} finally {
				if (isOwner()) {
					loadingPromises.delete(path);
					flightOwners.delete(path);
				}
			}
		})();

		loadingPromises.set(path, promise);
		return promise;
	};
	return revalidateCache;
};
