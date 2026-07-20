import { useRouteItemData } from '../state/hooks.ts';
import { getParamsObject } from '../utils/utils';
import { useMemo } from 'react';
import { useRouter } from './useRouter.ts';

export const useParams = <T>() => {
	const router = useRouter();
	const [routeItemData] = useRouteItemData(router);
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
