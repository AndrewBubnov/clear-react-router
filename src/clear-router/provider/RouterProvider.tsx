import { RouterContext } from '../context/RouterContext';
import { PropsWithChildren } from 'react';
import { RouterType } from '../types/global';

export const RouterProvider = ({ children, runtime, state }: PropsWithChildren<RouterType>) => (
	<RouterContext.Provider value={{ state, runtime }}>{children}</RouterContext.Provider>
);
