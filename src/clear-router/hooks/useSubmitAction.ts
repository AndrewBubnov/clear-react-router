import { SubmitEvent, useCallback, useState } from 'react';
import { router } from '../instance';

type FormProps = {
	action: string;
	onSuccess?(arg: unknown): void;
	onError?(arg: unknown): void;
	autoReset?: boolean;
};

export const useSubmitAction = ({ action, autoReset = true, ...options }: FormProps) => {
	const currentAction = router.hooks.useAction(action, options);
	const [data, setData] = useState<unknown>();
	const [error, setError] = useState<Error | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const submit = useCallback(
		async (formData: FormData) => {
			setIsSubmitting(true);
			const result = await currentAction(formData);
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
			const { error } = await submit(new FormData(target));
			if (autoReset && !error) target.reset();
		},
		[submit, autoReset]
	);

	return { submit, onSubmit, data, error, isSubmitting };
};
