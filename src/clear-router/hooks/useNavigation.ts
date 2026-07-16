import { useCallback, useEffect, useRef } from 'react';
import { useBlockedRoute, useIsLoading, useLoaderFallback, useScrollMap, useContextState } from '../state/state';
import { comparePaths, getParamsObject, parseWindowLocation } from '../utils/utils';
import { isCacheItemFresh } from '../utils/isCacheItemFresh';
import { loaderStateRef, revalidateCache } from '../utils/revalidateCache';
import { prevPathname } from '../utils/navigation';
import { transitionedNavigation } from '../utils/transitionedNavigation';
import { emptyLoaderState } from '../constants';
import { Location, RouteItem } from '../types/global';

type UseHandleNavigation = {
	routes: RouteItem[];
	isAnimated: boolean;
	showFallbackOnAnimation: boolean;
};

const ALL_LOCATIONS = '*';

export const useNavigation = ({ routes, isAnimated, showFallbackOnAnimation: showFallback }: UseHandleNavigation) => {
	const [, setIsLoading] = useIsLoading();
	const [, setScrollMap] = useScrollMap();
	const [, setCurrentLoaderFallback] = useLoaderFallback();
	const [context, setContext] = useContextState();
	const [blockedRoute, setBlockedRoute] = useBlockedRoute();

	const navigationSeq = useRef<number>(0);

	const navigationHandler = useCallback(
		async (nextLocation: Location) => {
			navigationSeq.current = navigationSeq.current + 1;
			const seq = navigationSeq.current;
			loaderStateRef.current = emptyLoaderState;

			const nextItem = routes.find(el => el.path === ALL_LOCATIONS || comparePaths(el, nextLocation.pathname));

			const params: Record<string, string> = getParamsObject({
				params: nextItem?.params,
				pathname: nextLocation.pathname,
			});

			if (nextItem?.beforeLoad) {
				const redirect = async (location: Location | string) =>
					// eslint-disable-next-line react-hooks/immutability
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
			setScrollMap(prevState => {
				const scrollPosition = document.scrollingElement?.scrollTop ?? 0;
				if (!scrollPosition || prevState[prevPathname.current] === scrollPosition) return prevState;
				return { ...prevState, [prevPathname.current]: scrollPosition };
			});
			setCurrentLoaderFallback(
				isCacheItemFresh({ routeItem: nextItem, pathname: nextLocation.pathname }) ||
					(isAnimated && !showFallback)
					? undefined
					: nextItem?.loaderFallback
			);
			if (nextItem?.loader) {
				setIsLoading(true);
				await revalidateCache({ routeItem: nextItem, pathname: nextLocation.pathname });
			}
			if (seq !== navigationSeq.current) return;
			transitionedNavigation(nextLocation, nextItem);
			if (nextItem?.afterLoad) await nextItem.afterLoad({ context, params, setContext });
		},
		[context, isAnimated, routes, setContext, setCurrentLoaderFallback, setIsLoading, setScrollMap, showFallback]
	);

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			if (prevPathname.current === blockedRoute.from) {
				setBlockedRoute({ from: prevPathname.current, to: newLocation.pathname });
				history.pushState(null, '', prevPathname.current);
			} else {
				navigationHandler(newLocation);
			}
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [blockedRoute.from, setBlockedRoute, navigationHandler]);

	useEffect(() => {
		const currentLocation = parseWindowLocation(window.location);
		navigationHandler(currentLocation);
		prevPathname.current = currentLocation.pathname;
	}, [navigationHandler]);

	return navigationHandler;
};
