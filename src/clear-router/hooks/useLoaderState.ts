import { useRouterData } from './useServiceContext';

export const useLoaderState = <T>() => {
	const { loaderState } = useRouterData();

	return loaderState as T;
};
