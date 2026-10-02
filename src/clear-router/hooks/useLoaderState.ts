import { router } from '../instance';

export const useLoaderState = () => {
	const { useRouteDataSelector } = router.hooks;
	return useRouteDataSelector(state => state.loaderState);
};
