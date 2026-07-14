import { useCallback } from 'react';
import { useGetAction } from './useGetAction';
import { useLatest } from './useLatest';

type Options =
	| Partial<{
			onSuccess: (args: unknown) => void;
			onError: (args: unknown) => void;
	  }>
	| undefined;

export const useAction = (action: string, options: Options = {}) => {
	const { currentAction, invalidate } = useGetAction(action);
	const latestOnSuccess = useLatest(options?.onSuccess);
	const latestOnError = useLatest(options?.onError);

	return useCallback(
		async (formData: FormData) => {
			try {
				const result = await currentAction(formData);
				await invalidate();
				latestOnSuccess.current?.(result);
			} catch (error) {
				latestOnError.current?.(error);
			}
		},
		[currentAction, invalidate, latestOnError, latestOnSuccess]
	);
};
