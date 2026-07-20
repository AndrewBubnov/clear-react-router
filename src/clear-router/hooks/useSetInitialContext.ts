import { useEffect } from 'react';
import { useRouter } from './useRouter';

export const useSetInitialContext = (initialContext?: Record<string, unknown>) => {
	const router = useRouter();
	const [_, setContext] = router.hooks.useContextState();

	useEffect(() => {
		if (initialContext) setContext(initialContext);
	}, [initialContext, setContext]);
};
