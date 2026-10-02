import { router } from '../instance';
import type { LoaderState } from '../types';

export const useLoaderState = <T = unknown>() => {
	const { useRouteDataSelector } = router.hooks;
	return useRouteDataSelector(state => state.loaderState) as LoaderState<T>;
};
