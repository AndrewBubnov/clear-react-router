import { isLoadingState, loaderFallbackState, scrollMapState } from '../state/state';
import { loaderStateRef, revalidateCache } from '../utils/revalidateCache';
import { comparePaths, getParamsObject } from '../utils/utils';
import { transitionedNavigation } from '../utils/transitionedNavigation';
import { prevPathname } from '../utils/navigation';
import { isCacheItemFresh } from '../utils/isCacheItemFresh';
import { routerConfig } from '../config/routerConfig';
import { getContext } from '../utils/getContext';
import { ALL_LOCATIONS, emptyLoaderState } from '../constants';
import { Location } from '../types/global';

const navigationSeq: Record<'current', number> = { current: 0 };

export const navigationHandler = async (nextLocation: Location) => {
	navigationSeq.current = navigationSeq.current + 1;
	const seq = navigationSeq.current;
	loaderStateRef.current = emptyLoaderState;
	const { routes, isAnimated, showFallbackOnAnimation: showFallback } = routerConfig;

	const nextItem = routes.find(el => el.path === ALL_LOCATIONS || comparePaths(el, nextLocation.pathname));

	const params: Record<string, string> = getParamsObject({
		params: nextItem?.params,
		pathname: nextLocation.pathname,
	});
	const { context, setContext } = getContext();

	if (nextItem?.beforeLoad) {
		const redirect = async (location: Location | string) =>
			await navigationHandler(typeof location === 'string' ? { pathname: location } : location);

		try {
			await nextItem.beforeLoad({
				context,
				redirect,
				params,
				setContext,
			});
			loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: null };
		} catch (error) {
			loaderStateRef.current = { ...loaderStateRef.current, beforeLoadError: error as Error };
			return transitionedNavigation(nextLocation, nextItem);
		}
	}
	if (seq !== navigationSeq.current) return;
	scrollMapState.setState(prevState => {
		const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
		if (!scrollPosition || prevState[prevPathname.current] === scrollPosition) return prevState;
		return { ...prevState, [prevPathname.current]: scrollPosition };
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
	if (seq !== navigationSeq.current) return;
	transitionedNavigation(nextLocation, nextItem);
	if (nextItem?.afterLoad) await nextItem.afterLoad({ context, params, setContext });
};
