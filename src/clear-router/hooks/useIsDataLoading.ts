import { router } from '../instance';

export const useIsDataLoading = () => {
	const { useRouteItemDataSelector } = router.hooks;
	const status = useRouteItemDataSelector(({ status }) => status);
	return status === 'pending';
};
