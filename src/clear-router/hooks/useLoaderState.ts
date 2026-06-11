import { useRouterData } from './useServiceContext.ts';

export const useLoaderState = <T>() => {
	const { loaderCache } = useRouterData();

	return loaderCache as T;
};
