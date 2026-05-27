import { use } from 'react';
import { RouterContext } from '../context/RouterContext.ts';

const ERROR_MESSAGE = 'must be used within Router component';

export const useRouterContext = (name: string = 'hooks and components') => {
	const context = use(RouterContext);

	if (!context) throw new Error(`${name} ${ERROR_MESSAGE}`);

	return context;
};
