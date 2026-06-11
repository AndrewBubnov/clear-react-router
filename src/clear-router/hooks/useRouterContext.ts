import { useRouterActions, useRouterData } from './useServiceContext';

export const useRouterContext = () => {
	const { context } = useRouterData();
	const { setContext } = useRouterActions();
	return { context, setContext };
};
