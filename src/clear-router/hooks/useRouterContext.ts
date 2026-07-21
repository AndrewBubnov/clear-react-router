import { router } from '../instance';

export const useRouterContext = () => {
	const [context, setContext] = router.hooks.useContextState();

	return { context, setContext };
};
