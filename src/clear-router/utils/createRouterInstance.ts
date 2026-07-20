import { create, useGlobalState } from '../state/createState';
import { Cell } from '../cell';
import { createNavigate } from '../runtime/navigate';
import { createInvalidate } from '../runtime/invalidate';
import { createPrefetch } from '../runtime/prefetch';
import { createTransitionedNavigation } from './transitionedNavigation';
import { createNavigationExecutor } from './navigationExecutor';
import { createIsCacheItemFresh } from './isCacheItemFresh';
import { createRevalidateCache } from './revalidateCache';
import { emptyLoaderState } from '../constants';
import { LoaderState, Location, RouteItem, RouteItemData, RouterState, RouterType } from '../types/global';

export const createRouterInstance = (): RouterType => {
	const routerState: RouterState = {
		isLoadingState: create(false),
		loaderFallbackState: create<RouteItem['loaderFallback']>(undefined),
		routeItemDataState: create<RouteItemData>({
			routeItem: undefined,
			location: {} as Location,
		}),
		currentLoaderState: create<LoaderState>(emptyLoaderState),
		scrollMapState: create<Record<string, number>>({}),
		contextState: create<Record<string, unknown>>({}),
		blockedRouteState: create<{ from: string; to: string }>({ from: '', to: '' }),
		loaderStateRef: new Cell<LoaderState>(emptyLoaderState),
		prevPathnameRef: new Cell<string>(''),
		timestampMap: new Map<string, number>(),
	};
	const loaderMapRef = {};
	const loadingPromises = new Map();

	const navigationExecutor = createNavigationExecutor({ ...routerState });
	const transitionedNavigation = createTransitionedNavigation(navigationExecutor, routerState.prevPathnameRef);
	const isCacheItemFresh = createIsCacheItemFresh(routerState.timestampMap);
	const revalidateCache = createRevalidateCache({
		...routerState,
		isCacheItemFresh,
		loadingPromises,
		loaderMapRef,
	});
	const navigate = createNavigate({ ...routerState, transitionedNavigation, isCacheItemFresh, revalidateCache });
	const invalidate = createInvalidate({ ...routerState, revalidateCache });
	const prefetch = createPrefetch(revalidateCache);

	return {
		state: {
			isLoadingState: routerState.isLoadingState,
			loaderFallbackState: routerState.loaderFallbackState,
			routeItemDataState: routerState.routeItemDataState,
			currentLoaderState: routerState.currentLoaderState,
			scrollMapState: routerState.scrollMapState,
			contextState: routerState.contextState,
			blockedRouteState: routerState.blockedRouteState,
			prevPathnameRef: routerState.prevPathnameRef,
		},
		runtime: {
			navigate,
			invalidate,
			prefetch,
		},
		hooks: {
			useIsLoading: () => useGlobalState(routerState.isLoadingState),
			useBlockedRoute: () => useGlobalState(routerState.blockedRouteState),
			useLoaderFallback: () => useGlobalState(routerState.loaderFallbackState),
			useRouteItemData: () => useGlobalState(routerState.routeItemDataState),
			useCurrentLoaderState: () => useGlobalState(routerState.currentLoaderState),
			useScrollMap: () => useGlobalState(routerState.scrollMapState),
			useContextState: () => useGlobalState(routerState.contextState),
		},
	};
};
