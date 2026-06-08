import { useRouterData } from './useServiceContext.ts';

export const useLoaderState = <T>() => {
	const { loaderCache } = useRouterData();

	return loaderCache[window.location.pathname] as T;
};
