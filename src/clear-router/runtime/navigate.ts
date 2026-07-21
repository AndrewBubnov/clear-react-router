import { isLoadingState, loaderFallbackState, scrollMapState } from '../state/state';
import { revalidateCache } from '../utils/revalidateCache';
import { getParamsObject } from '../utils/utils';
import { commitNavigation } from '../utils/commitNavigation.ts';
import { isCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { findRoute } from '../utils/findRoute';
import { getContext } from '../utils/getContext';
import { loaderStateRef, prevPathnameRef } from '../cell';
import { emptyLoaderState } from '../constants';
import { Location, RouteItem } from '../types/global';

let navigationSeq = 0;

const routeResolve = (location: Location) => {
	navigationSeq = navigationSeq + 1;
	const seq = navigationSeq;
	loaderStateRef.set(emptyLoaderState);

	const nextItem = findRoute(location.pathname, true);

	const params = getParamsObject({
		params: nextItem?.params,
		pathname: location.pathname,
	});

	return { nextItem, params, seq };
};

const beforeLoad = async (routeItem: RouteItem | undefined, location: Location, params: Record<string, string>) => {
	if (!routeItem?.beforeLoad) return;
	const redirect = async (redirected: Location | string) =>
		await navigate(typeof redirected === 'string' ? { pathname: redirected } : redirected);
	const { context, setContext } = getContext();
	try {
		await routeItem.beforeLoad({
			context,
			redirect,
			params,
			setContext,
		});
		loaderStateRef.set(prev => ({ ...prev, beforeLoadError: null }));
	} catch (error) {
		loaderStateRef.set(prev => ({ ...prev, beforeLoadError: error as Error }));
		return commitNavigation(location, routeItem);
	}
};

const routeChangePrepare = (routeItem: RouteItem | undefined, location: Location) => {
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
	if (!routeItem?.afterLoad) return;
	const { context, setContext } = getContext();
	await routeItem.afterLoad({ context, params, setContext });
};

export const navigate = async (nextLocation: Location) => {
	const { nextItem, params, seq } = routeResolve(nextLocation);
	await beforeLoad(nextItem, nextLocation, params);
	if (seq !== navigationSeq) return;
	routeChangePrepare(nextItem, nextLocation);
	await loader(nextItem, nextLocation);
	if (seq !== navigationSeq) return;
	commitNavigation(nextLocation, nextItem);
	await afterLoad(nextItem, params);
};
