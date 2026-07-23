import { create, useGlobalState } from '../create';
import { createNavigate } from '../runtime/navigate';
import { createInvalidate } from '../runtime/invalidate';
import { createPrefetch } from '../runtime/prefetch';
import { createRevalidateCache } from './revalidateCache';
import { Cell } from '../cell';
import { getParamsObject } from './utils';
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
	const navigate = createNavigate(routerState, revalidateCache);

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
			useParams: <T>() => {
				const routeItemData = routerState.routeItemDataState.getState();
				return getParamsObject({
					params: routeItemData.routeItem?.params,
					pathname: routeItemData.location.pathname,
				}) as T;
			},
			useNavigate: () => {
				const { blockedRouteState } = routerState;
				const { location } = routerState.routeItemDataState.getState();

				return async (arg: Location | string | -1) => {
					if (arg !== -1 && blockedRouteState.getState().from) {
						const to = typeof arg === 'object' ? arg.pathname : arg;
						blockedRouteState.setState(prevState => ({ ...prevState, to }));
						return;
					}
					if (arg === -1) return history.go(arg);
					if (typeof arg === 'string') {
						if (arg !== location.pathname) await navigate({ pathname: arg });
					} else if (JSON.stringify(arg) !== JSON.stringify(location)) {
						await navigate(arg);
					}
				};
			},
		},
	};
};
