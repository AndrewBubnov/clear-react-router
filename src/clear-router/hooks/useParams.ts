import { useNavigationState } from './useServiceContext';
import { getParamsObject } from '../utils/utils';

export const useParams = <T>() => {
	const {
		routeItemData: {
			routeItem,
			location: { pathname },
		},
	} = useNavigationState();

	if (!routeItem) return undefined as T;

	return getParamsObject({
		params: routeItem?.params,
		pathname,
	}) as T;
};
