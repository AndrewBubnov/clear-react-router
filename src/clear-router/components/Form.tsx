import { PropsWithChildren, SubmitEvent, useState } from 'react';
import { useInvalidate } from '../hooks/useInvalidate';
import { useContextState, useRouteItemData } from '../state/state';
import { FormProvider } from '../provider/FormProvider';
import { useParams } from '../hooks/useParams.ts';
import { useNavigate } from '../hooks/useNavigate.ts';

type FormProps = {
	actionKey: string;
	onSuccess?(arg: unknown): void;
	onError?(arg: unknown): void;
};

export const Form = ({ children, actionKey, onSuccess, onError }: PropsWithChildren<FormProps>) => {
	const invalidate = useInvalidate();
	const [routeItemData] = useRouteItemData();
	const [context, setContext] = useContextState();
	const redirect = useNavigate();
	const params = useParams<Record<string, string>>();
	const { routeItem } = routeItemData;
	const [isSubmitting, setIsSubmitting] = useState(false);

	const onSubmit = async (evt: SubmitEvent<HTMLFormElement>) => {
		evt.preventDefault();
		if (!routeItem) throw new Error('routeItem not found');
		if (!routeItem.actionCreator) throw new Error('routeItem actionCreator not found');
		const action = routeItem.actionCreator({ context, setContext, params, redirect })[actionKey];
		if (!action) throw new Error('action not found');
		try {
			setIsSubmitting(true);
			const result = await action(new FormData(evt.target));
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
