import { useRouteItemData } from '../state/state';
import { getParamsObject } from '../utils/utils';

export const useParams = <T>() => {
	const [routeItemData] = useRouteItemData();
	const {
		routeItem,
		location: { pathname },
	} = routeItemData;

	if (!routeItem) return undefined as T;

	return getParamsObject({
		params: routeItem?.params,
		pathname,
	}) as T;
};
