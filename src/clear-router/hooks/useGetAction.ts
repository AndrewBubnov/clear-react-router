import { useInvalidate } from './useInvalidate';
import { useParams } from './useParams';
import { useLatest } from './useLatest';
import { useRouter } from './useRouter';

export const useGetAction = (actionKey: string) => {
	const {
		hooks: { useRouteItemData, useContextState },
	} = useRouter();
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const latestContext = useLatest(context);

	if (!routeItem) throw new Error('Route not found');
	if (!routeItem.actions) throw new Error('Route action creator not found');
	const action = routeItem.actions({ context: latestContext.current, setContext, params, invalidate })[actionKey];
	if (!action) throw new Error(`Action "${actionKey}" not found`);

	return { currentAction: action, invalidate };
};
