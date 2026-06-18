import { createContext } from 'react';
import { BlockerState, Location, RouteItem, UpdateBlockedRouteProps } from '../types/global.ts';

export type NavigationContextValue = {
	location: Location;
	blockerState: BlockerState;
	routeList: RouteItem[];
	isLoading: boolean;
	shouldErrorElementShown: boolean;
	isAnimated: boolean;
};

export type ActionsContextValue = {
	updateLocation(route: Location): Promise<void>;
	updateBlockedRoute(arg: UpdateBlockedRouteProps): void;
	prefetchLoader(arg: string): Promise<void>;
	setContext(arg: object): void;
};

export type DataContextValue = {
	loaderCache: unknown;
	context: Record<string, unknown>;
};

export const ActionsContext = createContext({} as ActionsContextValue);
export const DataContext = createContext({} as DataContextValue);
export const NavigationContext = createContext({} as NavigationContextValue);
