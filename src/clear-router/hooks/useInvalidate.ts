import { useRouterActions } from './useRouterActions.ts';

export const useInvalidate = () => {
	const { invalidate } = useRouterActions();
	return invalidate;
};
