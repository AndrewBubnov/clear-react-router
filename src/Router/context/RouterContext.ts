import { createContext } from 'react';
import type { Location } from '../types.ts';

export type RouterContextProps = {
	location: Location;
	setLocation(route: Location): void;
	params: Record<string, string>;
	loaderCache: Record<string, unknown>;
	prefetchLoader(arg: string): Promise<void>;
};

export const RouterContext = createContext({} as RouterContextProps);
