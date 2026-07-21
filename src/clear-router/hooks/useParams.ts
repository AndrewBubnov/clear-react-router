import { useMemo } from 'react';
import { router } from '../instance';
import { getParamsObject } from '../utils/utils';

export const useParams = <T>() => {
	const [routeItemData] = router.hooks.useRouteItemData();
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
