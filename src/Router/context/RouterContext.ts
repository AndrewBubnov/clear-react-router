import { createContext } from 'react';
import type { BlockerState, Location, UpdateBlockedRouteProps } from '../types.ts';

export type RouterContextProps = {
	location: Location;
	updateLocation(route: Location): void;
	params: Record<string, string>;
	loaderCache: Record<string, unknown>;
	prefetchLoader(arg: string): Promise<void>;
	updateBlockedRoute(arg: UpdateBlockedRouteProps): void;
	blockerState: BlockerState;
};

export const RouterContext = createContext({} as RouterContextProps);
