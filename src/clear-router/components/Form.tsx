import { PropsWithChildren, SubmitEvent, useState } from 'react';
import { useInvalidate } from '../hooks/useInvalidate';
import { useRouteItemData } from '../state/state';
import { FormProvider } from '../provider/FormProvider';

type FormProps = {
	actionKey: string;
	onSuccess?(arg: unknown): void;
	onError?(arg: unknown): void;
};

export const Form = ({ children, actionKey, onSuccess, onError }: PropsWithChildren<FormProps>) => {
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const { routeItem } = routeItemData;
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (evt: SubmitEvent<HTMLFormElement>) => {
		evt.preventDefault();
		const formData = new FormData(evt.target);
		if (!routeItem) throw new Error('RouteItem not found');
		const action = routeItem.actions?.[actionKey];
		if (!action) throw new Error('action not found');
		try {
			setIsSubmitting(true);
			const result = await action(formData);
			await invalidate();
			evt.target.reset();
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
