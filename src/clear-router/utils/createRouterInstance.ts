import { create, useGlobalState } from '../create';
import { createNavigate } from '../runtime/navigate';
import { createInvalidate } from '../runtime/invalidate';
import { createPrefetch } from '../runtime/prefetch';
import { createRevalidateCache } from './revalidateCache';
import { Cell } from '../cell';
import { getParamsObject } from './utils';
import { emptyLoaderState } from '../constants';
import { LoaderState, Location, Options, RouteItemData, RouterState, RouterType } from '../types';

const defaultRouteItemData = {
	routeItem: undefined,
	location: {} as Location,
};

export const createRouterInstance = (): RouterType => {
	const routerState: RouterState = {
		isLoadingState: create(false),
		routeItemDataState: create<RouteItemData>(defaultRouteItemData),
		currentLoaderState: create<LoaderState>(emptyLoaderState),
		scrollMapState: create<Record<string, number>>({}),
		contextState: create<Record<string, unknown>>({}),
		blockedRouteState: create<{ from: string; to: string }>({ from: '', to: '' }),
		loaderStateRef: new Cell<LoaderState>(emptyLoaderState),
		prevPathnameRef: new Cell<string>(''),
		pendingState: new Cell<RouteItemData | undefined>(undefined),
		timestampMap: new Map<string, number>(),
	};

	const revalidateCache = createRevalidateCache(routerState);
	const invalidate = createInvalidate(routerState, revalidateCache);
	const navigate = createNavigate(routerState, revalidateCache);

	const prefetch = createPrefetch(revalidateCache);

	const useGetAction = (actionKey: string) => {
		const { routeItem } = routerState.routeItemDataState.getState();
		const context = routerState.contextState.getState();
		const setContext = routerState.contextState.setState;
		const params = getParamsObject();
		if (!routeItem) throw new Error('Route not found');
		if (!routeItem.actions) throw new Error('Route action creator not found');
		const action = routeItem.actions({ context, setContext, params, invalidate })[actionKey];
		if (!action) throw new Error(`Action "${actionKey}" not found`);
		return { currentAction: action, invalidate };
	};

	return {
		state: routerState,
		runtime: { navigate, invalidate, prefetch },
		hooks: {
			useIsLoading: () => useGlobalState(routerState.isLoadingState),
			useBlockedRoute: () => useGlobalState(routerState.blockedRouteState),
			useRouteItemData: () => useGlobalState(routerState.routeItemDataState),
			useCurrentLoaderState: () => useGlobalState(routerState.currentLoaderState),
			useScrollMap: () => useGlobalState(routerState.scrollMapState),
			useContextState: () => useGlobalState(routerState.contextState),
			useParams: <T>() => getParamsObject() as T,
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
			useRestoreScroll: () => {
				const { pathname } = routerState.routeItemDataState.getState().location;
				const scrollMap = routerState.scrollMapState.getState();
				return () => {
					if (scrollMap[pathname]) {
						requestAnimationFrame(() => window.scrollTo({ top: scrollMap[pathname], behavior: 'smooth' }));
					}
				};
			},
			useGetAction,
			useAction: (action: string, options: Options = {}) => {
				const { currentAction, invalidate } = useGetAction(action);
				return async (formData: FormData) => {
					try {
						const result = await currentAction(formData);
						await invalidate();
						options.onSuccess?.(result);
					} catch (error) {
						options.onError?.(error);
					}
				};
			},
		},
	};
};
