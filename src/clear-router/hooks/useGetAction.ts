import { useInvalidate } from './useInvalidate';
import { useContextState, useRouteItemData } from '../state/state';
import { useParams } from './useParams';
import { useLatest } from './useLatest';

export const useGetAction = (action: string) => {
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const latestContext = useLatest(context);

	if (!routeItem) throw new Error('Route not found');
	if (!routeItem.actions) throw new Error('Route action creator not found');
	const currentAction = routeItem.actions({ context: latestContext.current, setContext, params, invalidate })[action];
	if (!currentAction) throw new Error(`Action "${action}" not found`);

	return { currentAction, invalidate };
};
