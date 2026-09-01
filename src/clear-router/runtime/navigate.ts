import { createCommitState } from '../utils/commitState';
import { commitNavigation } from '../utils/commitNavigation';
import { createIsCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { getParams, getPartialLoaderArgs, sleep, updateScrollMap } from '../utils/utils';
import { EMPTY_LOADER_STATE } from '../constants';
import { BeforeLoad, Location, RevalidateCache, RouteItem, RouterState } from '../types';

export const createNavigate = (routerState: RouterState, revalidateCache: RevalidateCache) => {
	let navigationSeq = 0;
	let interval = 0;
	let abortController: AbortController | null = null;

	const { loaderState, loaderStateRef, statusState, contextState, loaderMap, routeItemDataState, scrollMapState } =
		routerState;
	const navigationExecutor = createCommitState(routerState);
	const isCacheItemFresh = createIsCacheItemFresh(loaderMap);

	const createSignal = () => {
		abortController?.abort();
		abortController = new AbortController();
		return abortController.signal;
	};

	const getPath = (nextLocation: Location) => `${nextLocation.pathname}${nextLocation.search}`;

	const getContext = () => ({ context: contextState.getState(), setContext: contextState.setState });

	const routeResolve = (location: Location) => {
		loaderStateRef.set(EMPTY_LOADER_STATE);
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
				loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
			} catch (error) {
				loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
			}
		};
		if (defaultBeforeLoad) await runBeforeLoad(defaultBeforeLoad);
		if (routeItem?.beforeLoad) await runBeforeLoad(routeItem?.beforeLoad);
	};

	const prepareNavigation = (routeItem: RouteItem | undefined, location: Location) => {
		updateScrollMap(routeItemDataState, scrollMapState);

		loaderState.setState(EMPTY_LOADER_STATE);
		const path = getPath(location);
		if (routeItem?.optimistic && loaderMap.has(path)) {
			statusState.setState('optimistic');
			const currentLoaderState = loaderMap.get(path)?.state;
			if (currentLoaderState) loaderState.setState(currentLoaderState);
		} else {
			const pendingShouldExist = routeItem?.loader && !isCacheItemFresh(path);
			// if (routeItem?.loaderFallback) {
			// commitNavigation(() => statusState.setState(pendingShouldExist ? 'pending' : 'active'));
			// } else {
			statusState.setState(pendingShouldExist ? 'pending' : 'active');
			// }
		}
		routeItemDataState.setState({ routeItem, location });
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
			: Promise.resolve;
	};

	const loader = async (routeItem: RouteItem | undefined, nextLocation: Location, seq: number) => {
		if (!routeItem?.loader) return;
		window.clearInterval(interval);
		const signal = createSignal();
		const [result] = await Promise.all([
			revalidateCache({ routeItem, location: nextLocation, signal }),
			getLoaderDurationPromise(routeItem, nextLocation),
		]);
		if (result) loaderStateRef.set(prev => ({ ...prev, data: result.data, loaderError: result.error as Error }));
		if (seq !== navigationSeq) return;
		polling(routeItem, nextLocation);
	};

	const afterLoad = async (routeItem: RouteItem | undefined, params: Record<string, string>) => {
		const { defaultAfterLoad } = routerConfig;
		if (routeItem?.afterLoad) await routeItem.afterLoad({ ...getContext(), params });
		if (defaultAfterLoad) await defaultAfterLoad({ ...getContext(), params });
	};

	const navigate = async (rawLocation: Location) => {
		const nextLocation = { ...rawLocation, search: rawLocation.search ?? '' };
		navigationSeq = navigationSeq + 1;
		const seq = navigationSeq;
		const { nextItem, params } = routeResolve(nextLocation);
		await beforeLoad(nextItem, nextLocation);
		if (seq !== navigationSeq) return;
		prepareNavigation(nextItem, nextLocation);
		await loader(nextItem, nextLocation, seq);
		if (seq !== navigationSeq) return;
		commitNavigation(() => navigationExecutor(nextLocation));
		await afterLoad(nextItem, params);
	};

	return navigate;
};
