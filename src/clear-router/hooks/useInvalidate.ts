import { useRouterActions } from './useServiceContext.ts';

export const useInvalidate = () => {
	const { invalidate } = useRouterActions();
	return invalidate;
};
