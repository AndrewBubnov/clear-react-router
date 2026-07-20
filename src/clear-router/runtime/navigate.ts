import { getParamsObject } from '../utils/utils';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { emptyLoaderState } from '../constants';
import { IsCacheItemFresh, Location, RevalidateCache, RouteItem, RouterState } from '../types/global';

type CreateNavigate = RouterState & {
	transitionedNavigation(nextLocation: Location, routeItem: RouteItem | undefined): void;
	isCacheItemFresh: IsCacheItemFresh;
	revalidateCache: RevalidateCache;
};

let navigationSeq = 0;

export const createNavigate = (args: CreateNavigate) => async (nextLocation: Location) => {
	const {
		loaderStateRef,
		transitionedNavigation,
		scrollMapState,
		prevPathnameRef,
		loaderFallbackState,
		isLoadingState,
		isCacheItemFresh,
		revalidateCache,
		contextState,
	} = args;
	navigationSeq = navigationSeq + 1;
	const seq = navigationSeq;
	loaderStateRef.set(emptyLoaderState);
	const { isAnimated, showFallbackOnAnimation: showFallback } = routerConfig;

	const nextItem = findRoute(nextLocation.pathname, true);

	const params: Record<string, string> = getParamsObject({
		params: nextItem?.params,
		pathname: nextLocation.pathname,
	});

	const context = contextState.getState();
	const setContext = contextState.setState;

	if (nextItem?.beforeLoad) {
		const redirect = async (location: Location | string) =>
			await createNavigate(args)(typeof location === 'string' ? { pathname: location } : location);
		try {
			await nextItem.beforeLoad({
				context,
				redirect,
				params,
				setContext,
			});
			loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
		} catch (error) {
			loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
			return transitionedNavigation(nextLocation, nextItem);
		}
	}
	if (seq !== navigationSeq) return;
	scrollMapState.setState(prevState => {
		const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
		if (!scrollPosition || prevState[prevPathnameRef.value] === scrollPosition) return prevState;
		return { ...prevState, [prevPathnameRef.value]: scrollPosition };
	});
	loaderFallbackState.setState(
		isCacheItemFresh({ routeItem: nextItem, pathname: nextLocation.pathname }) || (isAnimated && !showFallback)
			? undefined
			: nextItem?.loaderFallback
	);
	if (nextItem?.loader) {
		isLoadingState.setState(true);
		await revalidateCache({ routeItem: nextItem, pathname: nextLocation.pathname });
	}
	if (seq !== navigationSeq) return;
	transitionedNavigation(nextLocation, nextItem);
	if (nextItem?.afterLoad) await nextItem.afterLoad({ context, params, setContext });
};
