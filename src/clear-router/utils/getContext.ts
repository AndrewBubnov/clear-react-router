import { contextState } from '../state/state.ts';

export const getContext = () => {
	const context = contextState.getState();
	const setContext = contextState.setState;
	return { context, setContext };
};
