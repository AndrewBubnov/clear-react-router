import { useCallback } from 'react';
import { useContextState, useRouteItemData } from '../state/state';
import { useInvalidate } from './useInvalidate';
import { useParams } from './useParams';
import { useLatest } from './useLatest';

export const useAction = (actionKey: string, onError?: (args: unknown) => void) => {
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const latestContext = useLatest(context);

	return useCallback(
		async (formData: FormData) => {
			if (!routeItem) throw new Error('route not found');
			if (!routeItem.actions) throw new Error('route action creator not found');
			const action = routeItem.actions({ context: latestContext.current, setContext, params, invalidate })[
				actionKey
			];
			if (!action) throw new Error('action not found');
			try {
				await action(formData);
				await invalidate();
			} catch (error) {
				onError?.(error);
			}
		},
		[actionKey, latestContext, invalidate, onError, params, routeItem, setContext]
	);
};
