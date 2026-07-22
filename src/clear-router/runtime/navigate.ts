import { createCommitState } from '../utils/commitState';
import { createCommitNavigation } from '../utils/commitNavigation';
import { createIsCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { getParamsObject } from '../utils/utils';
import { emptyLoaderState } from '../constants';
import { BeforeLoad, Location, RevalidateCache, RouteItem, RouterState } from '../types';

let navigationSeq = 0;

export const createNavigate = (routerSta: RouterState, revalidateCache: RevalidateCache) => {
	const {
		loaderStateRef,
		scrollMapState,
		prevPathnameRef,
		loaderFallbackState,
		isLoadingState,
		contextState,
		timestampMap,
	} = routerSta;
	const navigationExecutor = createCommitState(routerSta);
	const commitNavigation = createCommitNavigation(navigationExecutor, prevPathnameRef);
	const isCacheItemFresh = createIsCacheItemFresh(timestampMap);

	const context = contextState.getState();
	const setContext = contextState.setState;

	const routeResolve = (location: Location) => {
		loaderStateRef.set(emptyLoaderState);
		const nextItem = findRoute(location.pathname, true);
		const params = getParamsObject({
			params: nextItem?.params,
			pathname: location.pathname,
		});
		return { nextItem, params };
	};

	const beforeLoad = async (routeItem: RouteItem | undefined, params: Record<string, string>) => {
		const { beforeLoad } = routerConfig;
		const runBeforeLoad = async (loaderFn: BeforeLoad) => {
			const redirect = async (redirected: Location | string) =>
				await navigate(typeof redirected === 'string' ? { pathname: redirected } : redirected);
			try {
				await loaderFn({
					context,
					redirect,
					params,
					setContext,
				});
				loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
			} catch (error) {
				loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
			}
		};
		if (beforeLoad) await runBeforeLoad(beforeLoad);
		if (routeItem?.beforeLoad) await runBeforeLoad(routeItem?.beforeLoad);
	};

	const prepareNavigation = (routeItem: RouteItem | undefined, location: Location) => {
		const { isAnimated, showFallbackOnAnimation: showFallback } = routerConfig;
		scrollMapState.setState(prevState => {
			const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
			if (!scrollPosition || prevState[prevPathnameRef.value] === scrollPosition) return prevState;
			return { ...prevState, [prevPathnameRef.value]: scrollPosition };
		});
		loaderFallbackState.setState(
			isCacheItemFresh({ routeItem, pathname: location.pathname }) || (isAnimated && !showFallback)
				? undefined
				: routeItem?.loaderFallback
		);
	};

	const loader = async (routeItem: RouteItem | undefined, location: Location) => {
		if (!routeItem?.loader) return;
		isLoadingState.setState(true);
		await revalidateCache({ routeItem, pathname: location.pathname });
	};

	const afterLoad = async (routeItem: RouteItem | undefined, params: Record<string, string>) => {
		const { afterLoad } = routerConfig;
		if (routeItem?.afterLoad) await routeItem.afterLoad({ context, params, setContext });
		if (afterLoad) await afterLoad({ context, params, setContext });
	};

	const navigate = async (nextLocation: Location) => {
		navigationSeq = navigationSeq + 1;
		const seq = navigationSeq;
		const { nextItem, params } = routeResolve(nextLocation);
		await beforeLoad(nextItem, params);
		if (seq !== navigationSeq) return;
		prepareNavigation(nextItem, nextLocation);
		await loader(nextItem, nextLocation);
		if (seq !== navigationSeq) return;
		commitNavigation(nextLocation, nextItem);
		await afterLoad(nextItem, params);
	};

	return navigate;
};
