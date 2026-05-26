import { use } from 'react';
import { RouterContext } from '../context/RouterContext.ts';

export const useLocation = () => {
	const context = use(RouterContext);

	if (!context) throw new Error('useParams hook must be used within RouterProvider');

	const { pathname, search } = window.location;

	return { pathname, search, state: context.navigationState };
};
