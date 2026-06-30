import { createContext } from 'react';
import { BlockerState, Location, RouteItem, RouteItemData, UpdateBlockedRouteProps } from '../types/global';

export type NavigationContextValue = {
	blockerState: BlockerState;
	routeItemData: RouteItemData;
	currentLoaderFallback: RouteItem['loaderFallback'];
};

export type ActionsContextValue = {
	setSearch(arg: string): void;
	updateLocation(route: Location): Promise<void>;
	updateBlockedRoute(arg: UpdateBlockedRouteProps): void;
	prefetchLoader(arg: string): Promise<void>;
	setContext(arg: object): void;
	restoreScroll(): void;
};

export type DataContextValue = {
	context: Record<string, unknown>;
};

export const ActionsContext = createContext({} as ActionsContextValue);
export const DataContext = createContext({} as DataContextValue);
export const NavigationContext = createContext({} as NavigationContextValue);
