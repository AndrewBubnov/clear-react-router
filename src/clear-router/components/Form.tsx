import { PropsWithChildren, SubmitEvent, useState } from 'react';
import { useContextState, useRouteItemData } from '../state/state';
import { useInvalidate } from '../hooks/useInvalidate';
import { useParams } from '../hooks/useParams';
import { FormProvider } from '../provider/FormProvider';

type FormProps = {
	action: string;
	onSuccess?(arg: unknown): void;
	onError?(arg: unknown): void;
	autoReset?: boolean;
};

export const Form = ({
	children,
	action: actionKey,
	onSuccess,
	onError,
	autoReset = true,
}: PropsWithChildren<FormProps>) => {
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (evt: SubmitEvent<HTMLFormElement>) => {
		evt.preventDefault();
		if (!routeItem) throw new Error('Route not found');
		if (!routeItem.actions) throw new Error('Route action creator not found');
		const action = routeItem.actions({ context, setContext, params, invalidate })[actionKey];
		if (!action) throw new Error(`Action "${actionKey}" not found`);
		try {
			setIsSubmitting(true);
			const result = await action(new FormData(evt.target));
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
