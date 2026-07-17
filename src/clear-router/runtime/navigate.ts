import { isLoadingState, loaderFallbackState, scrollMapState } from '../state/state';
import { revalidateCache } from '../utils/revalidateCache';
import { comparePaths, getParamsObject } from '../utils/utils';
import { transitionedNavigation } from '../utils/transitionedNavigation';
import { isCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { getContext } from '../utils/getContext';
import { loaderStateRef, prevPathnameRef } from '../cell';
import { ALL_LOCATIONS, emptyLoaderState } from '../constants';
import { Location } from '../types/global';

let navigationSeq = 0;

export const navigate = async (nextLocation: Location) => {
	navigationSeq = navigationSeq + 1;
	const seq = navigationSeq;
	loaderStateRef.set(emptyLoaderState);
	const { routes, isAnimated, showFallbackOnAnimation: showFallback } = routerConfig;

	const nextItem = routes.find(el => el.path === ALL_LOCATIONS || comparePaths(el, nextLocation.pathname));

	const params: Record<string, string> = getParamsObject({
		params: nextItem?.params,
		pathname: nextLocation.pathname,
	});
	const { context, setContext } = getContext();

	if (nextItem?.beforeLoad) {
		const redirect = async (location: Location | string) =>
			await navigate(typeof location === 'string' ? { pathname: location } : location);

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
