import { createContext } from 'react';
import { Location } from '../types/global';

export type ActionsContextValue = {
	updateLocation(route: Location): Promise<void>;
	prefetchLoader(arg: string): Promise<void>;
	invalidate(path?: string): void;
};

export const ActionsContext = createContext({} as ActionsContextValue);
