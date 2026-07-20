import { useMemo } from 'react';
import { getParamsObject } from '../utils/utils';
import { useRouter } from './useRouter';

export const useParams = <T>() => {
	const router = useRouter();
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
