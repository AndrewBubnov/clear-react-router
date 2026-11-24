import { createIsCacheItemFresh } from '../utils/isCacheItemFresh';
import { getPartialLoaderArgs, sleep, toCacheKey } from '../utils/utils';
import { routerConfig } from '../config/routerConfig';
import { LoadingPromise, Retry, RevalidateCacheArgs, RouteItem, RouterState } from '../types';

const PRELOAD_STALE_TIME = 30_000;

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

export const createRevalidateCache = (routerState: RouterState, syncCacheSnapshot: () => void) => {
	const { loaderMap, loadingPromises, contextState, routeDataState } = routerState;
	const flightOwners = new Map<string, AbortController | AbortSignal>();
	const flightReasons = new Map<string, RevalidateCacheArgs['reason']>();

	const evict = () => {
		if (loaderMap.size <= routerConfig.maxCacheSize) return;
		const { pathname, search = '' } = routeDataState.getState().location;
		const currentPath = toCacheKey(`${pathname}${search}`);
		const oldestKey = [...loaderMap.keys()].find(key => key !== currentPath);
		if (oldestKey) {
			// A pending GC timer of the evicted entry must not fire later and
			// delete whatever (possibly fresh) entry is then stored under the
			// same path.
			const item = loaderMap.get(oldestKey);
			if (item?.gcTimeout) window.clearTimeout(item.gcTimeout);
			loaderMap.delete(oldestKey);
			syncCacheSnapshot();
		}
	};
	const moveItemToLastPosition = (path: string) => {
		const item = loaderMap.get(path);
		if (item) {
			loaderMap.delete(path);
			loaderMap.set(path, item);
			syncCacheSnapshot();
		}
		return item;
	};

	const revalidateCache = async (
		{ routeItem, location, signal, force, reason }: RevalidateCacheArgs,
		retried = 0
	): LoadingPromise => {
		if (!routeItem?.loader) return;
		// An already-aborted caller would start a flight whose result is
		// discarded — and would supersede a live flight for nothing. Null =
		// 'nothing happened', same sentinel as every other discarded flight.
		if (signal?.aborted) return null;

		// The Router-level default is applied here, in the core, and still
		// respects an explicit `externalCache: false` on the route.
		const externalCache = routeItem.externalCache ?? routerConfig.defaultExternalCache;

		const isCacheItemFresh = createIsCacheItemFresh(loaderMap);

		const { pathname, search = '' } = location;
		const path = toCacheKey(`${pathname}${search}`);

		if (loadingPromises.has(path)) {
			const owner = flightOwners.get(path);
			const ownerWasAborted = owner instanceof AbortController ? owner.signal.aborted : owner?.aborted;
			// A navigation may ride another navigation's flight (the supersede
			// chain aborts both together), but never a prefetch flight: its external
			// signal can be aborted by a third party at any moment without
			// superseding the navigation, which would commit empty data.
			const canRide = reason === 'prefetch' || flightReasons.get(path) !== 'prefetch';
			// A prefetch is never a superseder: it rides or, when nothing live is
			// running, starts its own flight.
			const canTakeOver = reason !== 'prefetch' && !!signal && owner instanceof AbortController;
			if (canTakeOver || ownerWasAborted || !canRide) {
				if (owner instanceof AbortController) owner.abort();
				loadingPromises.delete(path);
				flightOwners.delete(path);
				flightReasons.delete(path);
				syncCacheSnapshot();
			} else {
				moveItemToLastPosition(path);
				return loadingPromises.get(path);
			}
		}

		if (!force && isCacheItemFresh(path)) {
			const item = loaderMap.get(path);
			if (reason === 'navigation' && item?.reason === 'prefetch') {
				item.reason = 'navigation';
				// Flagged routes never claim freshness — the entry stays stale (0)
				// after demotion; ordinary routes take the route's own policy.
				item.staleTime = externalCache ? 0 : routeItem.staleTime;
			}
			moveItemToLastPosition(path);
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
			flightReasons.set(path, reason);
			const isOwner = () => flightOwners.get(path) === ownerToken;
			try {
				const result = await routeItem?.loader({
					...getPartialLoaderArgs(contextState, location, routeItem),
					signal: effectiveSignal,
					attempt: retried + 1,
				});
				// Superseded or aborted flights have no authoritative result: return
				// null so callers treat it as 'nothing happened' (their guards skip it).
				if (!isOwner() || effectiveSignal.aborted) return null;
				const resolvedStaleTime = routeItem.staleTime ?? routerConfig.defaultStaleTime ?? 0;
				loaderMap.set(path, {
					state: { data: result, beforeLoadError: null, loaderError: null },
					timestamp: Date.now(),
					staleTime: externalCache
						? 0
						: reason === 'prefetch'
							? Math.max(resolvedStaleTime, PRELOAD_STALE_TIME)
							: routeItem.staleTime,
					reason,
				});
				evict();
				syncCacheSnapshot();
				return { data: result, error: null };
			} catch (error) {
				if (effectiveSignal.aborted || !isOwner()) return null;
				const retry = getRetry(routeItem);
				if (retry && retry.count > retried) {
					if (isOwner()) {
						loadingPromises.delete(path);
						flightOwners.delete(path);
						flightReasons.delete(path);
					}
					if (retry.delay) await sleep(retry.delay);
					// A bare `return promise` runs the finally synchronously and wipes this retry
					// flight's owner entries (both share the owner token) — the retry's result
					// would then be discarded as 'not owner'. Await keeps the finally after the chain.
					return await revalidateCache({ routeItem, location, signal, force, reason }, retried + 1);
				} else {
					return { data: null, error };
				}
			} finally {
				if (isOwner()) {
					loadingPromises.delete(path);
					flightOwners.delete(path);
					flightReasons.delete(path);
					syncCacheSnapshot();
				}
			}
		})();

		loadingPromises.set(path, promise);
		syncCacheSnapshot();
		return promise;
	};
	return revalidateCache;
};
