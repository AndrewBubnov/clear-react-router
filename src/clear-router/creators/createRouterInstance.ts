import { create, useGlobalState } from '../create';
import { createNavigate } from '../runtime/navigate';
import { createInvalidate } from '../runtime/invalidate';
import { createPrefetch } from '../runtime/prefetch';
import { createRevalidateCache } from '../runtime/revalidateCache';
import { getParams, restoreScroll } from '../utils/utils';
import { Cell } from '../cell';
import { EMPTY_LOADER_STATE } from '../constants';
import {
	LoaderState,
	LoaderStateItem,
	LoadingPromise,
	Location,
	Options,
	RouteItemData,
	RouterState,
	RouterType,
	ScrollMap,
	ScrollRestorationBehavior,
	Status,
} from '../types';

export const createRouterInstance = (): RouterType => {
	const routerState: RouterState = {
		routeItemDataState: create<RouteItemData>({
			routeItem: undefined,
			location: {} as Location,
		}),
		statusState: create<Status>('idle'),
		scrollMapState: create<ScrollMap>({}),
		contextState: create<Record<string, unknown>>({}),
		blockedRouteState: create<{ from: string; to: string }>({ from: '', to: '' }),
		loaderState: create<LoaderState>(EMPTY_LOADER_STATE),
		loaderStateRef: new Cell<LoaderState>(EMPTY_LOADER_STATE),
		loaderMap: new Map<string, LoaderStateItem>(),
		loadingPromises: new Map<string, LoadingPromise>(),
	};

	const revalidateCache = createRevalidateCache(routerState);
	const invalidate = createInvalidate(routerState, revalidateCache);
	const navigate = createNavigate(routerState, revalidateCache);

	const prefetch = createPrefetch(routerState, revalidateCache);

	const getCurrentAction = (actionKey: string) => {
		const { routeItem, location } = routerState.routeItemDataState.getState();
		if (!routeItem) throw new Error('Route not found');
		if (!routeItem.actions) throw new Error('Route action creator not found');
		const context = routerState.contextState.getState();
		const setContext = routerState.contextState.setState;
		const params = getParams(location, routeItem);
		const searchParams: Record<string, string> = Object.fromEntries(new URLSearchParams(location.search).entries());
		const action = routeItem.actions({ context, setContext, params, location, searchParams })[actionKey];
		if (!action) throw new Error(`Action "${actionKey}" not found`);
		return action;
	};

	return {
		state: routerState,
		runtime: { navigate, invalidate, prefetch },
		hooks: {
			useBlockedRoute: () => useGlobalState(routerState.blockedRouteState),
			useRouteItemData: () => useGlobalState(routerState.routeItemDataState),
			useScrollMap: () => useGlobalState(routerState.scrollMapState),
			useStatus: () => useGlobalState(routerState.statusState),
			useContextState: () => useGlobalState(routerState.contextState),
			useLoaderState: <T = unknown>() => useGlobalState(routerState.loaderState)[0] as LoaderState<T>,
			useParams: <T>() => {
				const { routeItem, location } = routerState.routeItemDataState.getState();
				return getParams(location, routeItem) as T;
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
			useAction: (action: string, options: Options = {}) => {
				const currentAction = getCurrentAction(action);
				return async (formData: FormData) => {
					try {
						const data = await currentAction(formData);
						await invalidate('', { withBeforeLoad: options.withBeforeLoad });
						options.onSuccess?.(data);
						return { data, error: null };
					} catch (error) {
						options.onError?.(error);
						return { data: null, error: error as Error };
					}
				};
			},
			useRestoreScroll: (restorationBehavior: ScrollRestorationBehavior) => {
				const {
					routeItem,
					location: { pathname },
				} = routerState.routeItemDataState.getState();
				const scrollMap = routerState.scrollMapState.getState();
				if (!routeItem || routeItem.scrollRestoration === false || !scrollMap[pathname]) return;
				return () =>
					restoreScroll(scrollMap, pathname, routeItem.scrollRestorationBehavior ?? restorationBehavior);
			},
		},
	};
};
