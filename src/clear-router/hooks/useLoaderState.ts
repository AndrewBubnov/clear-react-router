import { useRouterData } from './useServiceContext';

export const useLoaderState = <T>() => {
	const { loaderCache } = useRouterData();

	return loaderCache as T;
};
