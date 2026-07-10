import { useEffect } from 'react';
import { useContextState } from '../state/state';

export const useSetInitialContext = (initialContext?: Record<string, unknown>) => {
	const [, setContext] = useContextState();
	useEffect(() => {
		if (initialContext) setContext(initialContext);
	}, [initialContext, setContext]);
};
