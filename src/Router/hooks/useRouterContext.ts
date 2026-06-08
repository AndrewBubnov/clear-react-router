import { useServiceContext } from './useServiceContext.ts';

export const useRouterContext = () => {
	const { context, setContext } = useServiceContext();
	return { context, setContext };
};
