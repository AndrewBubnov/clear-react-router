import { useContextState } from '../state/state';

export const useRouterContext = () => {
	const [context, setContext] = useContextState();

	return { context, setContext };
};
