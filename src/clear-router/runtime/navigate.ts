import { createCommitState } from '../utils/commitState';
import { commitNavigation } from '../utils/commitNavigation';
import { createIsCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { getParams, getPartialLoaderArgs, sleep, updateScrollMap } from '../utils/utils';
import { BeforeLoad, LoaderState, Location, RevalidateCache, RouteItem, RouterState } from '../types';

export const createNavigate = (routerState: RouterState, revalidateCache: RevalidateCache) => {
	let navigationSeq = 0;
	let interval = 0;
	let abortController: AbortController | null = null;

	const {
		loaderState,
		contextState,
		loaderMap,
		routeItemDataState,
		scrollMapState,
		blockerState,
		blockedTargetState,
	} = routerState;
	const commitState = createCommitState(routerState);
	const isCacheItemFresh = createIsCacheItemFresh(loaderMap);

	const createSignal = () => {
		abortController?.abort();
		abortController = new AbortController();
		return abortController.signal;
	};

	const getPath = (nextLocation: Location) => `${nextLocation.pathname}${nextLocation.search}`;

	const routeResolve = (location: Location) => {
		const nextItem = findRoute(location.pathname, true);
		const params = getParams(location, nextItem);
		return { nextItem, params };
	};

	const beforeLoad = async (routeItem: RouteItem | undefined, nextLocation: Location) => {
		const { defaultBeforeLoad } = routerConfig;
		const runBeforeLoad = async (loaderFn: BeforeLoad) => {
			const redirect = async (redirected: Location | string) =>
				await navigate(typeof redirected === 'string' ? { pathname: redirected } : redirected);
			try {
				await loaderFn({ redirect, ...getPartialLoaderArgs(contextState, nextLocation, routeItem) });
				return null;
			} catch (error) {
				return error as Error;
			}
		};
		let error = null;
		if (defaultBeforeLoad) error = await runBeforeLoad(defaultBeforeLoad);
		if (routeItem?.beforeLoad && !error) error = await runBeforeLoad(routeItem?.beforeLoad);
		return error;
	};

	const createGcTimeout = () => {
		const { routeItem, location } = routeItemDataState.getState();
		if (!routeItem?.gcTime) return;
		const path = `${location.pathname}${location.search}`;
		const currentLoaderEntry = loaderMap.get(path);
		if (!currentLoaderEntry) return;
		if (currentLoaderEntry.gcTimeout) window.clearTimeout(currentLoaderEntry?.gcTimeout);
		const gcTimeout = window.setTimeout(() => loaderMap.delete(path), routeItem.gcTime);
		loaderMap.set(path, { ...currentLoaderEntry, gcTimeout });
	};

	const prepareNavigation = (routeItem: RouteItem | undefined, location: Location, hasError: boolean) => {
		updateScrollMap(routeItemDataState, scrollMapState);
		createGcTimeout();
		if (hasError) return;
		const path = getPath(location);
		if (routeItem?.optimistic && loaderMap.has(path)) {
			commitNavigation(() => routeItemDataState.setState({ routeItem, location, status: 'optimistic' }));
			const currentLoaderState = loaderMap.get(path)?.state;
			if (currentLoaderState) loaderState.setState(currentLoaderState);
			return;
		}
		if (routeItem?.loader && !isCacheItemFresh(path)) {
			commitNavigation(() => routeItemDataState.setState({ routeItem, location, status: 'pending' }));
		}
	};

	const polling = (routeItem: RouteItem | undefined, nextLocation: Location) => {
		if (!routeItem?.pollingInterval) return;
		const signal = createSignal();
		interval = window.setInterval(
			() => revalidateCache({ routeItem, location: nextLocation, signal }),
			routeItem.pollingInterval
		);
	};

	const getLoaderDurationPromise = (routeItem: RouteItem | undefined, nextLocation: Location) => {
		const minLoaderDuration = routeItem?.minLoaderDuration ?? routerConfig.defaultMinLoaderDuration ?? 0;
		return minLoaderDuration && !isCacheItemFresh(getPath(nextLocation))
			? sleep(minLoaderDuration)
			: Promise.resolve();
	};

	const loader = async (routeItem: RouteItem | undefined, nextLocation: Location, seq: number) => {
		if (!routeItem?.loader) return;
		window.clearInterval(interval);
		const signal = createSignal();
		const [result] = await Promise.all([
			revalidateCache({ routeItem, location: nextLocation, signal }),
			getLoaderDurationPromise(routeItem, nextLocation),
		]);
		if (seq !== navigationSeq) return;
		polling(routeItem, nextLocation);
		return result;
	};

	const afterLoad = async (routeItem: RouteItem | undefined, params: Record<string, string>) => {
		const { defaultAfterLoad } = routerConfig;
		const searchParams: Record<string, string> = Object.fromEntries(new URLSearchParams(location.search).entries());
		const args = { context: contextState.getState(), params, searchParams };
		if (routeItem?.afterLoad) await routeItem.afterLoad(args);
		if (defaultAfterLoad) await defaultAfterLoad(args);
	};

	const checkBlocked = (nextLocation: Location) => {
		if (blockerState.getState() === 'charged') {
			blockerState.setState('blocked');
			blockedTargetState.setState(nextLocation);
			return true;
		}
		return false;
	};

	const clearCurrentGcTimeout = (routeItem: RouteItem | undefined, location: Location) => {
		const path = `${location.pathname}${location.search}`;
		if (!routeItem?.gcTime) return;
		const currentLoaderEntry = loaderMap.get(path);
		if (!currentLoaderEntry?.gcTimeout) return;
		window.clearTimeout(currentLoaderEntry.gcTimeout);
		loaderMap.set(path, { ...currentLoaderEntry, gcTimeout: undefined });
	};

	const navigate = async (rawLocation: Location) => {
		const nextLocation = { ...rawLocation, search: rawLocation.search ?? '' };
		if (checkBlocked(nextLocation)) return;
		navigationSeq = navigationSeq + 1;
		const seq = navigationSeq;
		const { nextItem, params } = routeResolve(nextLocation);
		const beforeLoadError = await beforeLoad(nextItem, nextLocation);
		if (seq !== navigationSeq) return;
		prepareNavigation(nextItem, nextLocation, !!beforeLoadError);
		const result = beforeLoadError
			? { data: null, error: null, beforeLoadError }
			: await loader(nextItem, nextLocation, seq);
		if (seq !== navigationSeq) return;
		const loaderStateValue: LoaderState = {
			data: result?.data,
			loaderError: (result?.error as Error | null) ?? null,
			beforeLoadError,
		};
		commitNavigation(() => commitState({ location: nextLocation, routeItem: nextItem, loaderStateValue }));
		clearCurrentGcTimeout(nextItem, nextLocation);
		void afterLoad(nextItem, params);
	};

	return navigate;
};
