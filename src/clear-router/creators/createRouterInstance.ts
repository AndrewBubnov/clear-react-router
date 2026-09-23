import { create, useGlobalState } from '../create';
import { createNavigate } from '../runtime/navigate';
import { createInvalidate } from '../runtime/invalidate';
import { createPrefetch } from '../runtime/prefetch';
import { createRevalidateCache } from '../runtime/revalidateCache';
import { formatSearchObject, getParams, isVerticalScroll } from '../utils/utils';
import { EMPTY_LOADER_STATE, WINDOW_LEFT, WINDOW_TOP } from '../constants';
import {
	BlockerState,
	LoaderState,
	LoaderStateItem,
	LoadingPromise,
	Location,
	NavigationLocation,
	Options,
	RouteItemData,
	RouterState,
	RouterType,
	ScrollMap,
	ScrollRestorationBehavior,
	Synchronizer,
} from '../types';

export const createRouterInstance = (synchronizer: Synchronizer): RouterType => {
	const routerState: RouterState = {
		routeItemDataState: create<RouteItemData>({
			routeItem: undefined,
			location: {} as Location,
			status: 'idle',
		}),
		scrollMapState: create<ScrollMap>({}),
		contextState: create<Record<string, unknown>>({}),
		blockerState: create<BlockerState>('unblocked'),
		loaderState: create<LoaderState>(EMPTY_LOADER_STATE),
		blockedTargetState: create<Location | null>(null),
		loaderMap: new Map<string, LoaderStateItem>(),
		loadingPromises: new Map<string, LoadingPromise>(),
	};

	const revalidateCache = createRevalidateCache(routerState);
	const navigate = createNavigate(routerState, revalidateCache);
	const invalidate = createInvalidate(routerState, revalidateCache);

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
		runtime: { navigate, invalidate, prefetch },
		hooks: {
			useBlockerState: () => useGlobalState<BlockerState>(routerState.blockerState, synchronizer),
			useRouteItemData: () => useGlobalState<RouteItemData>(routerState.routeItemDataState, synchronizer),
			useScrollMap: () => useGlobalState<ScrollMap>(routerState.scrollMapState, synchronizer),
			useContextState: () => useGlobalState<Record<string, unknown>>(routerState.contextState, synchronizer),
			useBlockedTargetState: () => useGlobalState<Location | null>(routerState.blockedTargetState, synchronizer),
			useLoaderState: <T = unknown>() =>
				useGlobalState<LoaderState<unknown>>(routerState.loaderState, synchronizer)[0] as LoaderState<T>,
			useParams: <T>() => {
				const { routeItem, location } = routerState.routeItemDataState.getState();
				return getParams(location, routeItem) as T;
			},
			useNavigate: () => async (arg: NavigationLocation | string | -1) => {
				const { location } = routerState.routeItemDataState.getState();
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
				} = routerState.routeItemDataState.getState();
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
						if (process.env.NODE_ENV !== 'production')
							console.warn(`Could not find element with ID "${key}"`);
						return;
					}
					const axis = isVerticalScroll(element) ? 'top' : 'left';
					requestAnimationFrame(() => {
						element.scrollTo({ [axis]: scrollPosition, behavior });
					});
				});
			},
		},
	};
};
