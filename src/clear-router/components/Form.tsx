import { PropsWithChildren, SubmitEvent, useState } from 'react';
import { FormProvider } from '../provider/FormProvider';
import { useGetAction } from '../hooks/useGetAction';

type FormProps = {
	action: string;
	onSuccess?(arg: unknown): void;
	onError?(arg: unknown): void;
	autoReset?: boolean;
};

export const Form = ({ children, action, onSuccess, onError, autoReset = true }: PropsWithChildren<FormProps>) => {
	const { currentAction, invalidate } = useGetAction(action);

	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (evt: SubmitEvent<HTMLFormElement>) => {
		evt.preventDefault();
		try {
			setIsSubmitting(true);
			const result = await currentAction(new FormData(evt.target));
			await invalidate();
			if (autoReset) evt.target.reset();
			onSuccess?.(result);
		} catch (error) {
			onError?.(error);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<FormProvider isSubmitting={isSubmitting}>
			<form onSubmit={onSubmit}>{children}</form>
		</FormProvider>
	);
};
