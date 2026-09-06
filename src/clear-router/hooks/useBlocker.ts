import { useCallback, useEffect, useMemo } from 'react';
import { useGlobalState } from '../create';
import { router } from '../instance';
import { useLocation } from './useLocation';
import { BlockerState, Location } from '../types';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

type BlockerCallback = {
	location: Location;
	nextLocation: Location | null;
	context: Record<string, unknown>;
};

export const useBlocker = (
	blockerFn: ({ location, nextLocation }: BlockerCallback) => boolean
): UseBlockerReturnValue => {
	const {
		hooks: { useBlockerState, useContextState },
		runtime: { navigate },
		state: { blockedTargetState },
	} = router;

	const [blockerState, setBlockerState] = useBlockerState();
	const location = useLocation();
	const [context] = useContextState();
	const [nextLocation] = useGlobalState(blockedTargetState);

	const args = useMemo(() => ({ location, nextLocation, context }), [context, location, nextLocation]);

	const shouldBlock = blockerFn(args);

	useEffect(() => setBlockerState(shouldBlock ? 'charged' : 'unblocked'), [setBlockerState, shouldBlock]);

	const processHandler = useCallback(async () => {
		setBlockerState('unblocked');
		const target = blockedTargetState.getState();
		if (target) await navigate(target);
		blockedTargetState.setState(null);
	}, [blockedTargetState, navigate, setBlockerState]);

	const resetHandler = useCallback(() => {
		setBlockerState('charged');
		blockedTargetState.setState(null);
	}, [setBlockerState, blockedTargetState]);

	return {
		state: blockerState,
		process: processHandler,
		reset: resetHandler,
	};
};
