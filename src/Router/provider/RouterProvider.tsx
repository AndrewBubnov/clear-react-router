import { type ReactNode } from 'react';
import { RouterContext, type RouterContextProps } from '../context/RouterContext.ts';

type RouterProviderProps = RouterContextProps & { children: ReactNode };

export const RouterProvider = ({ children, ...rest }: RouterProviderProps) => (
	<RouterContext value={{ ...rest }}>{children}</RouterContext>
);
