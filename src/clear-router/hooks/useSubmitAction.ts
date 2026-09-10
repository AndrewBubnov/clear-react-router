import { SubmitEvent, useCallback, useState } from 'react';
import { router } from '../instance';
import { FormValues } from '../types.ts';

type Options = {
	onSuccess?(arg: unknown): void;
	onError?(arg: unknown): void;
	autoReset?: boolean;
	withBeforeLoad?: boolean;
};

export const useSubmitAction = (action: string, options?: Options) => {
	const currentAction = router.hooks.useAction(action, options);
	const [data, setData] = useState<unknown>();
	const [error, setError] = useState<Error | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const submit = useCallback(
		async (data: FormValues) => {
			setIsSubmitting(true);
			const result = await currentAction(data);
			setIsSubmitting(false);
			setData(result.data);
			setError(result.error);
			return result;
		},
		[currentAction]
	);

	const onSubmit = useCallback(
		async (evt: SubmitEvent<HTMLFormElement>) => {
			evt.preventDefault();
			const target = evt.target as HTMLFormElement;
			const { error } = await submit(Object.fromEntries(new FormData(target)));
			const preventReset = options?.autoReset === false;
			if (!preventReset && !error) target.reset();
		},
		[options?.autoReset, submit]
	);

	return { submit, onSubmit, data, error, isSubmitting };
};
