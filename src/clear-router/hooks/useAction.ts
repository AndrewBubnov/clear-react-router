import { useCallback } from 'react';
import { useInvalidate } from './useInvalidate';
import { useContextState, useRouteItemData } from '../state/state';
import { useNavigate } from './useNavigate';
import { useParams } from './useParams';
import { useLatest } from './useLatest';

export const useAction = (actionKey: string, onError?: (args: unknown) => void) => {
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const redirect = useNavigate();
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const latestContext = useLatest(context);

	return useCallback(
		async (formData: FormData) => {
			if (!routeItem) throw new Error('routeItem not found');
			if (!routeItem.actionCreator) throw new Error('routeItem actionCreator not found');
			const action = routeItem.actionCreator({ context: latestContext.current, setContext, params, redirect })[
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
		[actionKey, latestContext, invalidate, onError, params, redirect, routeItem, setContext]
	);
};
