import { type ReactNode } from 'react';
import {
	NavigationContext,
	ActionsContext,
	DataContext,
	type ActionsContextValue,
	type DataContextValue,
	type NavigationContextValue,
} from '../context/RouterProviderContext';

type ProviderProps = NavigationContextValue & ActionsContextValue & DataContextValue & { children: ReactNode };

export const Provider = ({
	children,
	setContext,
	context,
	updateBlockedRoute,
	updateLocation,
	location,
	setLocation,
	prefetchLoader,
	loaderState,
	blockerState,
	isLoading,
	routeItemData,
}: ProviderProps) => {
	return (
		<ActionsContext.Provider
			value={{
				setLocation,
				updateLocation,
				updateBlockedRoute,
				prefetchLoader,
				setContext,
			}}
		>
			<DataContext.Provider value={{ context, loaderState }}>
				<NavigationContext.Provider value={{ blockerState, location, isLoading, routeItemData }}>
					{children}
				</NavigationContext.Provider>
			</DataContext.Provider>
		</ActionsContext.Provider>
	);
};
