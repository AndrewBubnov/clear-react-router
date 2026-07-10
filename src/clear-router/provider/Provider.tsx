import { type ReactNode } from 'react';
import { ActionsContext, type ActionsContextValue } from '../context/RouterProviderContext';

type ProviderProps = ActionsContextValue & { children: ReactNode };

export const Provider = ({ children, updateLocation, prefetchLoader, invalidate }: ProviderProps) => {
	return (
		<ActionsContext.Provider
			value={{
				updateLocation,
				prefetchLoader,
				invalidate,
			}}
		>
			{children}
		</ActionsContext.Provider>
	);
};
