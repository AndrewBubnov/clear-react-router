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
	setSearch,
	prefetchLoader,
	loaderState,
	blockerState,
	isLoading,
	routeItemData,
	restoreScroll,
	currentLoaderFallback,
}: ProviderProps) => {
	return (
		<ActionsContext.Provider
			value={{
				setSearch,
				updateLocation,
				updateBlockedRoute,
				prefetchLoader,
				setContext,
				restoreScroll,
			}}
		>
			<DataContext.Provider value={{ context, loaderState }}>
				<NavigationContext.Provider value={{ blockerState, isLoading, routeItemData, currentLoaderFallback }}>
					{children}
				</NavigationContext.Provider>
			</DataContext.Provider>
		</ActionsContext.Provider>
	);
};
