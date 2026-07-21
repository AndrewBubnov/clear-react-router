import { isLoadingState, loaderFallbackState, scrollMapState } from '../state/state';
import { revalidateCache } from '../utils/revalidateCache';
import { getParamsObject } from '../utils/utils';
import { commitNavigation } from '../utils/commitNavigation';
import { isCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { getContext } from '../utils/getContext';
import { loaderStateRef, prevPathnameRef } from '../cell';
import { emptyLoaderState } from '../constants';
import { BeforeLoad, Location, RouteItem } from '../types/global';

let navigationSeq = 0;

const routeResolve = (location: Location) => {
	loaderStateRef.set(emptyLoaderState);
	const nextItem = findRoute(location.pathname, true);
	const params = getParamsObject({ params: nextItem?.params, pathname: location.pathname });
	return { nextItem, params };
};

const beforeLoad = async (routeItem: RouteItem | undefined, params: Record<string, string>) => {
	const { beforeLoad } = routerConfig;
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
	if (routeItem?.afterLoad) await routeItem.afterLoad({ ...getContext(), params });
	if (afterLoad) await afterLoad({ ...getContext(), params });
};

export const navigate = async (nextLocation: Location) => {
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
