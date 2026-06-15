import { useContext } from 'react';
import { ActionsContext, DataContext, NavigationContext } from '../context/RouterContext';

export const useNavigationState = () => {
	const context = useContext(NavigationContext);

	if (!Object.keys(context).length) throw new Error('useNavigationState must be used within Router component');

	return context;
};

export const useRouterActions = () => {
	const context = useContext(ActionsContext);

	if (!Object.keys(context).length) throw new Error('useRouterActions must be used within Router component');

	return context;
};

export const useRouterData = () => {
	const context = useContext(DataContext);

	if (!Object.keys(context).length) throw new Error('useRouterData must be used within Router component');

	return context;
};
