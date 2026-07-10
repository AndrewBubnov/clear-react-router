import { createContext } from 'react';
import { Location, UpdateBlockedRouteProps } from '../types/global';

export type ActionsContextValue = {
	updateLocation(route: Location): Promise<void>;
	updateBlockedRoute(arg: UpdateBlockedRouteProps): void;
	prefetchLoader(arg: string): Promise<void>;
	setContext(arg: object): void;
	invalidate(path?: string): void;
};

export type DataContextValue = {
	context: Record<string, unknown>;
};

export const ActionsContext = createContext({} as ActionsContextValue);
export const DataContext = createContext({} as DataContextValue);
