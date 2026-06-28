import { useRouterData } from './useServiceContext';
import { useLocation } from './useLocation.ts';

export const useLoaderState = <T>() => {
	const { pathname } = useLocation();
	const { loaderState } = useRouterData();

	return loaderState[pathname].data as T;
};
