import { useRouterContext } from './useRouterContext.ts';

export const useLoaderState = <T>() => {
	const { loaderCache } = useRouterContext('useLoaderState');

	return loaderCache[window.location.pathname] as T;
};
