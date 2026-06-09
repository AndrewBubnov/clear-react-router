import { useRouterActions, useRouterData } from './useServiceContext.ts';

export const useRouterContext = () => {
	const { context } = useRouterData();
	const { setContext } = useRouterActions();
	return { context, setContext };
};
