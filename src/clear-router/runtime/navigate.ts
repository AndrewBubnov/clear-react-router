import { createCommitState } from '../utils/commitState';
import { commitNavigation } from '../utils/commitNavigation';
import { createIsCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { getParamsObject, sleep } from '../utils/utils';
import { emptyLoaderState } from '../constants';
import { BeforeLoad, Location, RevalidateCache, RouteItem, RouterState } from '../types';

export const createNavigate = (routerState: RouterState, revalidateCache: RevalidateCache) => {
	let navigationSeq = 0;
	let interval = 0;
	let abortController: AbortController | null = null;

	const {
		loaderState,
		loaderStateRef,
		scrollMapState,
		statusState,
		contextState,
		loaderMap,
		routeItemDataState,
		isOptimisticLoading,
	} = routerState;
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
		loaderStateRef.set(emptyLoaderState);
		const nextItem = findRoute(location.pathname, true);
		const params = getParamsObject(nextItem, location.pathname);
		return { nextItem, params };
	};

	const beforeLoad = async (
		routeItem: RouteItem | undefined,
		nextLocation: Location,
		params: Record<string, string>
	) => {
		const { defaultBeforeLoad } = routerConfig;
		const runBeforeLoad = async (loaderFn: BeforeLoad) => {
			const redirect = async (redirected: Location | string) =>
				await navigate(typeof redirected === 'string' ? { pathname: redirected } : redirected);
			const searchParams: Record<string, string> = Object.fromEntries(
				new URLSearchParams(nextLocation.search).entries()
			);
			try {
				await loaderFn({ ...getContext(), redirect, params, location: nextLocation, searchParams });
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
		const path = getPath(location);
		if (routeItem?.optimistic && loaderMap.has(path)) {
			routeItemDataState.setState({ routeItem, location });
			isOptimisticLoading.setState(true);
			const currentLoaderState = loaderMap.get(path)?.state;
			if (currentLoaderState) loaderState.setState(currentLoaderState);
		} else {
			const pendingShouldExist = routeItem?.loader && !isCacheItemFresh(path);
			commitNavigation(() => statusState.setState(pendingShouldExist ? 'pending' : 'active'));
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
		if (result) loaderStateRef.set(prev => ({ ...prev, ...result }));
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
		await beforeLoad(nextItem, nextLocation, params);
		if (seq !== navigationSeq) return;
		prepareNavigation(nextItem, nextLocation);
		await loader(nextItem, nextLocation, seq);
		if (seq !== navigationSeq) return;
		commitNavigation(() => navigationExecutor(nextLocation, nextItem));
		await afterLoad(nextItem, params);
	};

	return navigate;
};
