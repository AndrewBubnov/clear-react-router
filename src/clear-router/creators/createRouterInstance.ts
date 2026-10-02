import { create, useGlobalState } from '../create';
import { createNavigate } from '../runtime/navigate';
import { createInvalidate } from '../runtime/invalidate';
import { createPrefetch } from '../runtime/prefetch';
import { createRevalidateCache } from '../runtime/revalidateCache';
import { formatSearchObject, getParams, isVerticalScroll } from '../utils/utils';
import { EMPTY_LOADER_STATE, WINDOW_LEFT, WINDOW_TOP } from '../constants';
import {
	BlockerState,
	LoaderStateItem,
	LoadingPromise,
	Location,
	NavigationLocation,
	Options,
	RouteData,
	RouterState,
	RouterType,
	ScrollMap,
	ScrollRestorationBehavior,
	Synchronizer,
} from '../types';

export const createRouterInstance = (synchronizer: Synchronizer): RouterType => {
	const routerState: RouterState = {
		routeDataState: create<RouteData>({
			routeItem: undefined,
			location: {} as Location,
			status: 'idle',
			loaderState: EMPTY_LOADER_STATE,
		}),
		scrollMapState: create<ScrollMap>({}),
		contextState: create<Record<string, unknown>>({}),
		blockerState: create<BlockerState>('unblocked'),
		blockedTargetState: create<Location | null>(null),
		loaderMap: new Map<string, LoaderStateItem>(),
		loadingPromises: new Map<string, LoadingPromise>(),
	};

	const revalidateCache = createRevalidateCache(routerState);
	const navigate = createNavigate(routerState, revalidateCache);
	const invalidate = createInvalidate(routerState, revalidateCache);

	const prefetch = createPrefetch(routerState, revalidateCache);

	const getCurrentAction = (actionKey: string) => {
		const { routeItem, location } = routerState.routeDataState.getState();
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
		runtime: { navigate, invalidate, prefetch },
		hooks: {
			useBlockerState: () => useGlobalState<BlockerState>(routerState.blockerState, synchronizer),
			useRouteItemData: () => useGlobalState<RouteData>(routerState.routeDataState, synchronizer),
			useScrollMap: () => useGlobalState<ScrollMap>(routerState.scrollMapState, synchronizer),
			useContextState: () => useGlobalState<Record<string, unknown>>(routerState.contextState, synchronizer),
			useBlockedTargetState: () => useGlobalState<Location | null>(routerState.blockedTargetState, synchronizer),
			useParams: <T>() => {
				const { routeItem, location } = routerState.routeDataState.getState();
				return getParams(location, routeItem) as T;
			},
			useNavigate: () => async (arg: NavigationLocation | string | -1) => {
				const { location } = routerState.routeDataState.getState();
				const prevLocation = { pathname: location.pathname, search: location.search };
				if (arg === -1) return history.go(arg);
				if (typeof arg === 'string') {
					const [pathname, search = ''] = arg.split('?');
					if (pathname !== location.pathname || search !== location.search) {
						await navigate({ pathname, search, prevLocation });
					}
					return;
				}
				const search = typeof arg.search === 'object' ? formatSearchObject(arg.search) : arg.search;
				await navigate({ ...arg, search, prevLocation });
			},
			useAction: (action: string, options: Options = {}) => {
				return async (input: Record<string, unknown>) => {
					try {
						const currentAction = getCurrentAction(action);
						const data = await currentAction(input);
						await invalidate();
						options.onSuccess?.(data);
						return { data, error: null };
					} catch (error) {
						options.onError?.(error);
						return { data: null, error: error as Error };
					}
				};
			},
			useScrollRestoration: (restorationBehavior: ScrollRestorationBehavior) => () => {
				const {
					routeItem,
					location: { pathname },
				} = routerState.routeDataState.getState();
				const scrollMap = routerState.scrollMapState.getState();

				if (!routeItem || routeItem.scrollRestoration === false || !scrollMap[pathname]) return;

				const behavior = routeItem.scrollRestorationBehavior ?? restorationBehavior;
				scrollMap[pathname].forEach(([key, scrollPosition]) => {
					if (key === WINDOW_TOP || key === WINDOW_LEFT) {
						requestAnimationFrame(() => {
							window.scrollTo({
								[key === WINDOW_TOP ? 'top' : 'left']: scrollPosition,
								behavior,
							});
						});
						return;
					}
					const element = document.getElementById(key);
					if (!element) {
						if (import.meta.env.DEV)
							console.warn(`Could not find element with ID "${key}" for scroll restoration.`);
						return;
					}
					const axis = isVerticalScroll(element) ? 'top' : 'left';
					requestAnimationFrame(() => {
						element.scrollTo({ [axis]: scrollPosition, behavior });
					});
				});
			},
			useRouteDataSelector: <T>(callback: (arg: RouteData) => T): T => {
				const state = routerState.routeDataState;
				return synchronizer(state.subscribe, () => callback(state.getState()));
			},
		},
	};
};
