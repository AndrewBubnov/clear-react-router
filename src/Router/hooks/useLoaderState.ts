import { useRouterContext } from './useRouterContext.ts';

export const useLoaderState = <T>() => {
	const { loaderResult } = useRouterContext('useLoaderState');

	return loaderResult as T;
};
