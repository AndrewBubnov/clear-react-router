import { useNavigationState } from './useServiceContext';
import { LoaderState } from '../types/global';

export const useLoaderState = <T>() => {
	const { loaderState } = useNavigationState();

	return loaderState as LoaderState<T>;
};
