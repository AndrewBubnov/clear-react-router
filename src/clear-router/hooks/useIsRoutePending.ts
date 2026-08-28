import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const { useStatus, useRouteItemData } = router.hooks;
	const [routeItemData] = useRouteItemData();
	const [status] = useStatus();
	return status === 'pending' && routeItemData?.location.pathname === routePath;
};
