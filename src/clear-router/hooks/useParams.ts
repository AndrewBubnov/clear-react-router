import { useNavigationState } from './useServiceContext.ts';
import { getParamsObject } from '../utils/utils.ts';

export const useParams = <T>() => {
	const {
		routeItemData: { routeItem },
	} = useNavigationState();

	if (!routeItem) return undefined as T;

	return getParamsObject({
		params: routeItem?.params,
		pathname: location.pathname,
	}) as T;
};
