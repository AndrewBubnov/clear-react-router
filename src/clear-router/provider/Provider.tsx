import { type ReactNode } from 'react';
import {
	NavigationContext,
	ActionsContext,
	DataContext,
	type ActionsContextValue,
	type DataContextValue,
	type NavigationContextValue,
} from '../context/RouterProviderContext.ts';

type ProviderProps = NavigationContextValue & ActionsContextValue & DataContextValue & { children: ReactNode };

export const Provider = ({
	children,
	setContext,
	context,
	updateBlockedRoute,
	updateLocation,
	location,
	prefetchLoader,
	loaderCache,
	blockerState,
	routeList,
	shouldErrorElementShown,
	isLoading,
	isAnimated,
}: ProviderProps) => {
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
				<NavigationContext.Provider
					value={{ blockerState, location, routeList, shouldErrorElementShown, isLoading, isAnimated }}
				>
					{children}
				</NavigationContext.Provider>
			</DataContext.Provider>
		</ActionsContext.Provider>
	);
};
