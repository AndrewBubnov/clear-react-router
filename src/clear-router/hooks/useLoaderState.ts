import { useNavigationState } from './useServiceContext';

export const useLoaderState = <T>() => {
	const { loaderState } = useNavigationState();

	return loaderState as T;
};
