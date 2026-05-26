import { createContext } from 'react';

export type RouterContextProps = {
	setRoute(route: string): void;
};

export const RouterContext = createContext({} as RouterContextProps);
