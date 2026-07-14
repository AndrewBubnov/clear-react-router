import { useRouterCallback } from './useRouterCallback';

export const useInvalidate = () => {
	const { invalidate } = useRouterCallback();
	return invalidate;
};
