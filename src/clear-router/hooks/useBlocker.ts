import { useCallback, useEffect } from 'react';
import { router } from '../instance';
import { useLocation } from './useLocation';
import { BlockerState, Location } from '../types';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

export const useBlocker = (
	blockerFn: ({ location, nextLocation }: { location: Location; nextLocation: Location | null }) => boolean
): UseBlockerReturnValue => {
	const {
		hooks: { useBlockerState },
		runtime: { navigate },
		state: { blockedRouteTargetRef },
	} = router;

	const [blockerState, setBlockerState] = useBlockerState();
	const location = useLocation();

	const shouldBlock = blockerFn({ location, nextLocation: blockedRouteTargetRef.value });

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
