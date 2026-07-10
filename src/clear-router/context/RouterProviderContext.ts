import { createContext } from 'react';
import { Location, UpdateBlockedRouteProps } from '../types/global';

export type ActionsContextValue = {
	updateLocation(route: Location): Promise<void>;
	updateBlockedRoute(arg: UpdateBlockedRouteProps): void;
	prefetchLoader(arg: string): Promise<void>;
	invalidate(path?: string): void;
};

export const ActionsContext = createContext({} as ActionsContextValue);
