import { useRouterContext } from './useRouterContext.ts';

export const useLocation = () => {
	const context = useRouterContext('useLocation');

	return context.location;
};
