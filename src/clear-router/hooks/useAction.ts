import { useCallback } from 'react';
import { useActionParams } from './useActionParams';

export const useAction = (actionKey: string, onError?: (args: unknown) => void) => {
	const { invalidate, routeItem, latestContext, params, setContext } = useActionParams();

	return useCallback(
		async (formData: FormData) => {
			if (!routeItem) throw new Error('Route not found');
			if (!routeItem.actions) throw new Error('Route action creator not found');
			const action = routeItem.actions({ context: latestContext.current, setContext, params, invalidate })[
				actionKey
			];
			if (!action) throw new Error(`Action "${actionKey}" not found`);
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
