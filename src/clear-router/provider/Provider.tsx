import { type ReactNode } from 'react';
import { ActionsContext, type ActionsContextValue } from '../context/RouterProviderContext';

type ProviderProps = ActionsContextValue & { children: ReactNode };

export const Provider = ({
	children,
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
				invalidate,
			}}
		>
			{children}
		</ActionsContext.Provider>
	);
};
