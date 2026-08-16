import { createCommitState } from '../utils/commitState';
import { createCommitNavigation } from '../utils/commitNavigation';
import { createIsCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { getParamsObject } from '../utils/utils';
import { emptyLoaderState } from '../constants';
import { BeforeLoad, Location, RevalidateCache, RouteItem, RouterState } from '../types';

export const createNavigate = (routerState: RouterState, revalidateCache: RevalidateCache) => {
	let navigationSeq = 0;
	let interval = 0;
	let navigationAbortController: AbortController | null = null;

	const { loaderStateRef, scrollMapState, pendingState, contextState, loaderMap, routeItemDataState } = routerState;
	const navigationExecutor = createCommitState(routerState);
	const commitNavigation = createCommitNavigation(navigationExecutor, routeItemDataState);
	const isCacheItemFresh = createIsCacheItemFresh(loaderMap);

	const createSignal = () => {
		navigationAbortController?.abort();
		navigationAbortController = new AbortController();
		return navigationAbortController.signal;
	};

	const getContext = () => ({ context: contextState.getState(), setContext: contextState.setState });

	const routeResolve = (location: Location) => {
		loaderStateRef.set(emptyLoaderState);
		const nextItem = findRoute(location.pathname, true);
		const params = getParamsObject(nextItem, location.pathname);
		return { nextItem, params };
	};

	const beforeLoad = async (routeItem: RouteItem | undefined, params: Record<string, string>) => {
		const { defaultBeforeLoad } = routerConfig;
		const runBeforeLoad = async (loaderFn: BeforeLoad) => {
			const redirect = async (redirected: Location | string) =>
				await navigate(typeof redirected === 'string' ? { pathname: redirected } : redirected);
			try {
				await loaderFn({ ...getContext(), redirect, params });
				loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
			} catch (error) {
				loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
			}
		};
		if (defaultBeforeLoad) await runBeforeLoad(defaultBeforeLoad);
		if (routeItem?.beforeLoad) await runBeforeLoad(routeItem?.beforeLoad);
	};

	const prepareNavigation = (routeItem: RouteItem | undefined, location: Location) => {
		scrollMapState.setState(prevState => {
			const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
			const prevPathname = routeItemDataState.getState().location.pathname;
			if (!scrollPosition || prevState[prevPathname] === scrollPosition) return prevState;
			return { ...prevState, [prevPathname]: scrollPosition };
		});
		const path = `${location.pathname}${location.search}`;
		if (routeItem?.optimistic && loaderMap.has(path)) {
			routeItemDataState.setState({ routeItem, location });
			const currentLoaderState = loaderMap.get(path)?.state;
			if (currentLoaderState) loaderStateRef.set(currentLoaderState);
		} else {
			const pendingShouldExist = routeItem?.loader && !isCacheItemFresh(path);
			pendingState.setState(pendingShouldExist ? { routeItem, location } : undefined);
		}
	};

	const polling = (routeItem: RouteItem | undefined, location: Location) => {
		if (!routeItem?.pollingInterval) return;
		const signal = createSignal();
		interval = window.setInterval(
			() => revalidateCache({ routeItem, pathname: location.pathname, search: location.search, signal }),
			routeItem.pollingInterval
		);
	};

	const loader = async (routeItem: RouteItem | undefined, location: Location, seq: number) => {
		if (!routeItem?.loader) return;
		window.clearInterval(interval);
		const signal = createSignal();
		await revalidateCache({ routeItem, pathname: location.pathname, search: location.search, signal });
		if (seq !== navigationSeq) return;
		polling(routeItem, location);
	};

	const afterLoad = async (routeItem: RouteItem | undefined, params: Record<string, string>) => {
		const { defaultAfterLoad } = routerConfig;
		if (routeItem?.afterLoad) await routeItem.afterLoad({ ...getContext(), params });
		if (defaultAfterLoad) await defaultAfterLoad({ ...getContext(), params });
	};

	const navigate = async (nextLocation: Location) => {
		navigationSeq = navigationSeq + 1;
		const seq = navigationSeq;
		const { nextItem, params } = routeResolve(nextLocation);
		await beforeLoad(nextItem, params);
		if (seq !== navigationSeq) return;
		prepareNavigation(nextItem, nextLocation);
		await loader(nextItem, nextLocation, seq);
		if (seq !== navigationSeq) return;
		commitNavigation(nextLocation, nextItem);
		await afterLoad(nextItem, params);
	};

	return navigate;
};
