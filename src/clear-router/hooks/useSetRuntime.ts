import { useEffect } from 'react';
import { useActionState } from '../state/state';

type UseSetRuntime = {
	updateLocation(arg: Location): Promise<void>;
};

export const useSetRouterRuntime = ({ updateLocation }: UseSetRuntime) => {
	const [, setCallbackState] = useActionState();

	useEffect(() => {
		setCallbackState({
			updateLocation,
		});
	}, [setCallbackState, updateLocation]);
};
