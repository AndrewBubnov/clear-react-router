import { createContext } from 'react';
import type { BlockerState, Location, UpdateBlockedRouteProps } from '../types.ts';

export type NavigationContextValue = {
	location: Location;
	params: Record<string, string>;
	blockerState: BlockerState;
};

export type ActionsContextValue = {
	updateLocation(route: Location): void;
	updateBlockedRoute(arg: UpdateBlockedRouteProps): void;
	prefetchLoader(arg: string): Promise<void>;
	setContext(arg: object): void;
};

export type DataContextValue = {
	loaderCache: Record<string, unknown>;
	context: Record<string, unknown>;
};

export const ActionsContext = createContext({} as ActionsContextValue);
export const DataContext = createContext({} as DataContextValue);
export const NavigationContext = createContext({} as NavigationContextValue);
