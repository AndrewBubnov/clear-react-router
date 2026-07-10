import { useEffect } from 'react';
import { useContextState } from '../state/state';

export const useSetInitialContext = (initialContext?: Record<string, unknown>) => {
	const setContext = useContextState()[1];
	useEffect(() => {
		if (initialContext) setContext(initialContext);
	}, [initialContext, setContext]);
};
