import { createContext } from 'react';
import type { Location } from '../types.ts';

export type RouterContextProps = {
	location: Location;
	setLocation(route: Location): void;
	params: Record<string, string>;
};

export const RouterContext = createContext({} as RouterContextProps);
