import { router } from '../instance.ts';

export const useRouterContext = () => {
	const [context, setContext] = router.hooks.useContextState();

	return { context, setContext };
};
