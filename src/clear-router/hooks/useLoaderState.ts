import { useCurrentLoaderState } from '../state/state';
import { LoaderState } from '../types/global';

export const useLoaderState = <T>() => {
	const [loaderState] = useCurrentLoaderState();

	return loaderState as LoaderState<T>;
};
