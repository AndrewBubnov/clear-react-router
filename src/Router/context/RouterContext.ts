import { createContext } from 'react';

export type RouterContextProps = {
	setRoute(route: string): void;
	params: Record<string, string>;
};

export const RouterContext = createContext({} as RouterContextProps);
