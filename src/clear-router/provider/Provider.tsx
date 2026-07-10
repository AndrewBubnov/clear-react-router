import { type ReactNode } from 'react';
import {
	ActionsContext,
	DataContext,
	type ActionsContextValue,
	type DataContextValue,
} from '../context/RouterProviderContext';

type ProviderProps = ActionsContextValue & DataContextValue & { children: ReactNode };

export const Provider = ({
	children,
	setContext,
	context,
	updateBlockedRoute,
	updateLocation,
	prefetchLoader,
	invalidate,
}: ProviderProps) => {
	return (
		<ActionsContext.Provider
			value={{
				updateLocation,
				updateBlockedRoute,
				prefetchLoader,
				setContext,
				invalidate,
			}}
		>
			<DataContext.Provider value={{ context }}>{children}</DataContext.Provider>
		</ActionsContext.Provider>
	);
};
