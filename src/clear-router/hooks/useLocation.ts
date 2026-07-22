import { router } from '../instance';

export const useLocation = () => {
	const [routeItemData] = router.hooks.useRouteItemData();

	return routeItemData.location;
};
