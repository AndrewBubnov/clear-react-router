import { create, useGlobalState } from '../create';
import { createNavigate } from '../runtime/navigate';
import { createInvalidate } from '../runtime/invalidate';
import { createPrefetch } from '../runtime/prefetch';
import { createRevalidateCache } from './revalidateCache';
import { Cell } from '../cell';
import { emptyLoaderState } from '../constants';
import { LoaderState, Location, RouteItem, RouteItemData, RouterState, RouterType } from '../types';

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

	const revalidateCache = createRevalidateCache(routerState);

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
			navigate: createNavigate(routerState, revalidateCache),
			invalidate: createInvalidate(routerState, revalidateCache),
			prefetch: createPrefetch(revalidateCache),
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
