import { useRouteItemData } from '../state/state';

export const useLocation = () => {
	const [routeItemData] = useRouteItemData();

	return routeItemData.location;
};
