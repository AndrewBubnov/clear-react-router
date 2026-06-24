import { useRouterData } from './useServiceContext';
import { useLocation } from './useLocation';

export const useLoaderState = <T>() => {
	const { pathname } = useLocation();
	const { loaderState } = useRouterData();

	return loaderState[pathname] as T;
};
