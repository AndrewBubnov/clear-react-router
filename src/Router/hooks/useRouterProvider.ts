import { use } from 'react';
import { RouterContext } from '../context/RouterContext.ts';

export const useRouterProvider = () => {
	const context = use(RouterContext);

	if (!context) throw new Error('component must be used within RouterProvider');

	return context;
};
