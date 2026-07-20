import { useContextState } from '../state/hooks.ts';

export const useRouterContext = () => {
	const [context, setContext] = useContextState();

	return { context, setContext };
};
