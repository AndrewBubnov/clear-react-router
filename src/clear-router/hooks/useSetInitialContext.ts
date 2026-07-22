import { useEffect } from 'react';
import { router } from '../instance';
import { RouterProps } from '../types';

export const useSetInitialContext = (initialContext?: RouterProps['context']) => {
	const [, setContext] = router.hooks.useContextState();

	useEffect(() => {
		if (initialContext) setContext(initialContext);
	}, [initialContext, setContext]);
};
