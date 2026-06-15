import { createContext } from 'react';
import type { BlockerState, Location, UpdateBlockedRouteProps } from '../types/global';

export type NavigationContextValue = {
	location: Location;
	params: Record<string, string>;
	blockerState: BlockerState;
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
