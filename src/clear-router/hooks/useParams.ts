import { useRouteItemData } from '../state/state';
import { getParamsObject } from '../utils/utils';
import { useMemo } from 'react';

export const useParams = <T>() => {
	const [routeItemData] = useRouteItemData();
	const {
		routeItem,
		location: { pathname },
	} = routeItemData;

	return useMemo(
		() =>
			routeItem
				? getParamsObject({
						params: routeItem?.params,
						pathname,
					})
				: undefined,
		[pathname, routeItem]
	) as T;
};
