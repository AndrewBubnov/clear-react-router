import { useInvalidate } from './useInvalidate.ts';
import { useContextState, useRouteItemData } from '../state/hooks.ts';
import { useParams } from './useParams';
import { useLatest } from './useLatest';
import { useRouter } from './useRouter.ts';

export const useGetAction = (actionKey: string) => {
	const router = useRouter();
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData(router);
	const [context, setContext] = useContextState(router);
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const latestContext = useLatest(context);

	if (!routeItem) throw new Error('Route not found');
	if (!routeItem.actions) throw new Error('Route action creator not found');
	const action = routeItem.actions({ context: latestContext.current, setContext, params, invalidate })[actionKey];
	if (!action) throw new Error(`Action "${actionKey}" not found`);

	return { currentAction: action, invalidate };
};
