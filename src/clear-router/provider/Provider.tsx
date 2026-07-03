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
	prefetchLoader,
	blockerState,
	routeItemData,
	restoreScroll,
	currentLoaderFallback,
	isLoading,
}: ProviderProps) => {
	return (
		<ActionsContext.Provider
			value={{
				updateLocation,
				updateBlockedRoute,
				prefetchLoader,
				setContext,
				restoreScroll,
			}}
		>
			<DataContext.Provider value={{ context }}>
				<NavigationContext.Provider value={{ blockerState, routeItemData, currentLoaderFallback, isLoading }}>
					{children}
				</NavigationContext.Provider>
			</DataContext.Provider>
		</ActionsContext.Provider>
	);
};
