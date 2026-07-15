import { createState } from './createState.ts';
import { emptyLoaderState } from '../constants';
import { LoaderState, Location, RouteItem, RouteItemData } from '../types/global';

type ActionState = {
	updateLocation(route: Location): Promise<void>;
	prefetchLoader(arg: string): Promise<void>;
	invalidate(path?: string): Promise<void>;
};

export const useIsLoading = createState(false);
export const useBlockedRoute = createState({ from: '', to: '' });
export const useLoaderFallback = createState<RouteItem['loaderFallback']>(undefined);
export const useRouteItemData = createState<RouteItemData>({
	routeItem: undefined,
	location: {} as Location,
});
export const useCurrentLoaderState = createState<LoaderState>(emptyLoaderState);
export const useScrollMap = createState<Record<string, number>>({});
export const useContextState = createState<Record<string, unknown>>({});
export const useActionState = createState<ActionState>({} as ActionState);
