import { useContext } from 'react';
import { ActionsContext, DataContext, NavigationContext } from '../context/RouterProviderContext.ts';

export const useNavigationState = () => {
	const context = useContext(NavigationContext);

	if (!Object.keys(context).length) throw new Error('hooks and Router component must be used within RouterProvider');

	return context;
};

export const useRouterActions = () => {
	const context = useContext(ActionsContext);

	if (!Object.keys(context).length) throw new Error('hooks and Router component must be used within RouterProvider');

	return context;
};

export const useRouterData = () => {
	const context = useContext(DataContext);

	if (!Object.keys(context).length) throw new Error('hooks and Router component must be used within RouterProvider');

	return context;
};
