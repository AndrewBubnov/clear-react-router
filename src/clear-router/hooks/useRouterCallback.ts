import { useMemo } from 'react';
import { useCallbackState } from '../state/state';

export const useRouterCallback = () => {
	const [callbackState] = useCallbackState();
	const { updateLocation, prefetchLoader, invalidate } = callbackState;
	return useMemo(
		() => ({ updateLocation, prefetchLoader, invalidate }),
		[updateLocation, prefetchLoader, invalidate]
	);
};
