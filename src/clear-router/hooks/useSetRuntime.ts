import { useEffect } from 'react';
import { useActionState } from '../state/state';

type UseSetRuntime = {
	updateLocation(arg: Location): Promise<void>;
	prefetchLoader(arg: string): Promise<void>;
	invalidate(arg?: string): Promise<void>;
};

export const useSetRouterRuntime = ({ updateLocation, prefetchLoader, invalidate }: UseSetRuntime) => {
	const [, setCallbackState] = useActionState();

	useEffect(() => {
		setCallbackState({
			updateLocation,
			prefetchLoader,
			invalidate,
		});
	}, [invalidate, prefetchLoader, setCallbackState, updateLocation]);
};
