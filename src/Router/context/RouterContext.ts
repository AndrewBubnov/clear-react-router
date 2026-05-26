import { createContext } from 'react';

export type RouterContextProps = {
	setRoute(route: string): void;
	params: Record<string, string>;
	updateNavigationState(arg: unknown): void;
	navigationState?: unknown;
};

export const RouterContext = createContext({} as RouterContextProps);
