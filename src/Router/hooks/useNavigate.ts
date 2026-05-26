import { use, useCallback } from 'react';
import { RouterContext } from '../context/RouterContext.ts';

type NavigateProps = {
	pathname: string;
	state?: unknown;
};

export const useNavigate = () => {
	const context = use(RouterContext);

	if (!context) throw new Error('useNavigate hook must be used within RouterProvider');

	return useCallback(
		(arg: NavigateProps | -1) => {
			if (arg === -1) return history.go(-1);
			if (arg.state) context.updateNavigationState(arg.state);
			context.setRoute(arg.pathname);
			history.pushState(null, '', arg.pathname);
		},
		[context]
	);
};
