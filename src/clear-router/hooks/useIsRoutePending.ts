import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const { useRouteItemData } = router.hooks;
	const [routeItemData] = useRouteItemData();
	return routeItemData.status === 'pending' && routeItemData?.location.pathname === routePath;
};
