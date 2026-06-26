import { type ReactNode } from 'react';
import {
	NavigationContext,
	ActionsContext,
	DataContext,
	type ActionsContextValue,
	type DataContextValue,
	type NavigationContextValue,
	PropsContext,
	PropsContextValue,
} from '../context/RouterProviderContext';

type ProviderProps = PropsContextValue &
	NavigationContextValue &
	ActionsContextValue &
	DataContextValue & { children: ReactNode };

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
	routeList,
	isLoading,
}: ProviderProps) => {
	return (
		<PropsContext.Provider value={{ routeList }}>
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
					<NavigationContext.Provider value={{ blockerState, location, isLoading }}>
						{children}
					</NavigationContext.Provider>
				</DataContext.Provider>
			</ActionsContext.Provider>
		</PropsContext.Provider>
	);
};
