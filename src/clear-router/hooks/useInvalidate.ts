import { useRouterActions } from './useServiceContext';

export const useInvalidate = () => {
	const { invalidate } = useRouterActions();
	return invalidate;
};
