import { use } from 'react';
import { RouterContext } from '../context/RouterContext.ts';

export const useParams = <T>() => {
	const context = use(RouterContext);

	if (!context) throw new Error('useParams hook must be used within RouterProvider');

	return context.params as T;
};
