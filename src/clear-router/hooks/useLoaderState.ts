import { useNavigationState } from './useServiceContext';

export const useLoaderState = <T>() => {
	const {
		routeItemData: { loaderState },
	} = useNavigationState();

	return loaderState as T;
};
