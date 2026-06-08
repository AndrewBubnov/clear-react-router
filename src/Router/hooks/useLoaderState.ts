import { useServiceContext } from './useServiceContext.ts';

export const useLoaderState = <T>() => {
	const { loaderCache } = useServiceContext('useLoaderState');

	return loaderCache[window.location.pathname] as T;
};
