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
	prefetchLoader,
	loaderCache,
	blockerState,
	routeList,
	shouldErrorElementShown,
	isLoading,
	isAnimated,
}: ProviderProps) => {
	return (
		<PropsContext.Provider value={{ routeList, isAnimated }}>
			<ActionsContext.Provider
				value={{
					updateLocation,
					updateBlockedRoute,
					prefetchLoader,
					setContext,
				}}
			>
				<DataContext.Provider value={{ context, loaderCache }}>
					<NavigationContext.Provider value={{ blockerState, location, shouldErrorElementShown, isLoading }}>
						{children}
					</NavigationContext.Provider>
				</DataContext.Provider>
			</ActionsContext.Provider>
		</PropsContext.Provider>
	);
};
