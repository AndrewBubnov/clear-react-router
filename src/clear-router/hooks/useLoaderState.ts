import { router } from '../instance';
import { LoaderState } from '../types';

export const useLoaderState = <T>() => {
	const [loaderState] = router.hooks.useCurrentLoaderState();

	return loaderState as LoaderState<T>;
};
