import { create, createState, useGlobalState } from './createState';
import { emptyLoaderState } from '../constants';
import { LoaderState, Location, RouteItem, RouteItemData } from '../types/global';

type Runtime = {
	updateLocation(route: Location): Promise<void>;
};

export const isLoadingState = create(false);
export const useIsLoading = () => useGlobalState(isLoadingState);

export const useBlockedRoute = createState({ from: '', to: '' });

export const loaderFallbackState = create<RouteItem['loaderFallback']>(undefined);
export const useLoaderFallback = () => useGlobalState(loaderFallbackState);

export const routeItemDataState = create<RouteItemData>({
	routeItem: undefined,
	location: {} as Location,
});
export const useRouteItemData = () => useGlobalState(routeItemDataState);

export const currentLoaderState = create<LoaderState>(emptyLoaderState);
export const useCurrentLoaderState = () => useGlobalState(currentLoaderState);

export const scrollMapState = create<Record<string, number>>({});
export const useScrollMap = () => useGlobalState(scrollMapState);

export const contextState = create<Record<string, unknown>>({});
export const useContextState = () => useGlobalState(contextState);

export const useActionState = createState<Runtime>({} as Runtime);
