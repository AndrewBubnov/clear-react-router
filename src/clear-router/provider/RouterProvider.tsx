import { type ReactNode } from 'react';
import {
	NavigationContext,
	ActionsContext,
	DataContext,
	type ActionsContextValue,
	type DataContextValue,
	type NavigationContextValue,
} from '../context/RouterContext.ts';

type RouterProviderProps = NavigationContextValue & ActionsContextValue & DataContextValue & { children: ReactNode };

export const RouterProvider = ({
	children,
	setContext,
	context,
	updateBlockedRoute,
	updateLocation,
	location,
	params,
	prefetchLoader,
	loaderCache,
	blockerState,
}: RouterProviderProps) => {
	return (
		<ActionsContext.Provider
			value={{
				updateLocation,
				updateBlockedRoute,
				prefetchLoader,
				setContext,
			}}
		>
			<DataContext.Provider value={{ context, loaderCache }}>
				<NavigationContext.Provider value={{ blockerState, params, location }}>
					{children}
				</NavigationContext.Provider>
			</DataContext.Provider>
		</ActionsContext.Provider>
	);
};
