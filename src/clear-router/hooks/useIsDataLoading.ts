import { router } from '../instance';

export const useIsDataLoading = () => {
	const { useRouteItemData } = router.hooks;
	const [routeData] = useRouteItemData();
	return routeData.status === 'pending';
};
