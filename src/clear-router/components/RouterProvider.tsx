import { PropsWithChildren, useMemo } from 'react';
import { createRouterInstance } from '../utils/createRouterInstance';
import { InstanceProvider } from '../provider/InstanceProvider';

export const RouterProvider = ({ children }: PropsWithChildren) => {
	const instance = useMemo(() => createRouterInstance(), []);

	return (
		<InstanceProvider state={instance.state} runtime={instance.runtime} hooks={instance.hooks}>
			{children}
		</InstanceProvider>
	);
};
