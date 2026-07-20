import { useEffect } from 'react';
import { useContextState } from '../state/hooks';
import { useRouter } from './useRouter';

export const useSetInitialContext = (initialContext?: Record<string, unknown>) => {
	const router = useRouter();
	const [, setContext] = useContextState(router);

	useEffect(() => {
		if (initialContext) setContext(initialContext);
	}, [initialContext, setContext]);
};
