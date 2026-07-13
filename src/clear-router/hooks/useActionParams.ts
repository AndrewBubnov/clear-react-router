import { useInvalidate } from './useInvalidate';
import { useContextState, useRouteItemData } from '../state/state';
import { useParams } from './useParams';
import { useLatest } from './useLatest';

export const useActionParams = () => {
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const latestContext = useLatest(context);

	return { invalidate, routeItem, latestContext, params, setContext };
};
