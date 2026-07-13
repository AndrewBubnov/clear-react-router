import { useCallback } from 'react';
import { useActionParams } from './useActionParams';
import { useLatest } from './useLatest';

type Options =
	| Partial<{
			onSuccess: (args: unknown) => void;
			onError: (args: unknown) => void;
	  }>
	| undefined;

export const useAction = (action: string, options: Options = {}) => {
	const { invalidate, routeItem, latestContext, params, setContext } = useActionParams();
	const latestOnSuccess = useLatest(options?.onSuccess);
	const latestOnError = useLatest(options?.onError);

	return useCallback(
		async (formData: FormData) => {
			if (!routeItem) throw new Error('Route not found');
			if (!routeItem.actions) throw new Error('Route action creator not found');
			const currentAction = routeItem.actions({ context: latestContext.current, setContext, params, invalidate })[
				action
			];
			if (!currentAction) throw new Error(`Action "${action}" not found`);
			try {
				const result = await currentAction(formData);
				await invalidate();
				latestOnSuccess.current?.(result);
			} catch (error) {
				latestOnError.current?.(error);
			}
		},
		[action, invalidate, latestContext, latestOnError, latestOnSuccess, params, routeItem, setContext]
	);
};
