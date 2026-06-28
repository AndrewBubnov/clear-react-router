import { Context, useContext } from 'react';
import { ActionsContext, DataContext, NavigationContext } from '../context/RouterProviderContext';

const useServiceState = <T extends object>(reactContext: Context<T>) => {
	const context = useContext(reactContext);

	if (!Object.keys(context).length) throw new Error('hooks and Router component must be used within RouterProvider');

	return context;
};

export const useNavigationState = () => useServiceState(NavigationContext);

export const useRouterActions = () => useServiceState(ActionsContext);

export const useRouterData = () => useServiceState(DataContext);
