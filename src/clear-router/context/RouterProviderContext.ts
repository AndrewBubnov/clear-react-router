import { createContext, Dispatch, SetStateAction } from 'react';
import { BlockerState, LoaderState, Location, RouteItem, UpdateBlockedRouteProps } from '../types/global';

export type PropsContextValue = {
	routeList: RouteItem[];
};
export type NavigationContextValue = {
	location: Location;
	blockerState: BlockerState;
	isLoading: boolean;
	nextRouteItem: RouteItem | undefined;
};

export type ActionsContextValue = {
	setLocation: Dispatch<SetStateAction<Location>>;
	updateLocation(route: Location): Promise<void>;
	updateBlockedRoute(arg: UpdateBlockedRouteProps): void;
	prefetchLoader(arg: string): Promise<void>;
	setContext(arg: object): void;
};

export type DataContextValue = {
	loaderState: LoaderState;
	context: Record<string, unknown>;
};

export const PropsContext = createContext({} as PropsContextValue);
export const ActionsContext = createContext({} as ActionsContextValue);
export const DataContext = createContext({} as DataContextValue);
export const NavigationContext = createContext({} as NavigationContextValue);
