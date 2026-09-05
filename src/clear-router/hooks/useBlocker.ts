import { useCallback, useEffect } from 'react';
import { router } from '../instance';
import { BlockerState } from '../types';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

export const useBlocker = (blockerFn: () => boolean): UseBlockerReturnValue => {
	const {
		hooks: { useBlockerState },
		runtime: { navigate },
		state: { blockedRouteTargetRef },
	} = router;

	const [blockerState, setBlockerState] = useBlockerState();

	const shouldBlock = blockerFn();

	useEffect(() => setBlockerState(shouldBlock ? 'charged' : 'unblocked'), [setBlockerState, shouldBlock]);

	const processHandler = useCallback(async () => {
		setBlockerState('unblocked');
		if (blockedRouteTargetRef.value) await navigate(blockedRouteTargetRef.value);
		blockedRouteTargetRef.set(null);
	}, [blockedRouteTargetRef, navigate, setBlockerState]);

	const resetHandler = useCallback(() => setBlockerState('unblocked'), [setBlockerState]);

	return {
		state: blockerState,
		process: processHandler,
		reset: resetHandler,
	};
};
