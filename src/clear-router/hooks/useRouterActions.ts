import { useMemo } from 'react';
import { useActionState } from '../state/state';

export const useRouterActions = () => {
	const [callbackState] = useActionState();
	const { updateLocation, prefetchLoader, invalidate } = callbackState;
	return useMemo(
		() => ({ updateLocation, prefetchLoader, invalidate }),
		[updateLocation, prefetchLoader, invalidate]
	);
};
