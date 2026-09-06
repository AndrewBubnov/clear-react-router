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
	const [nextLocation, setNextLocation] = useGlobalState(blockedTargetState);

	const args = useMemo(() => ({ location, nextLocation, context }), [context, location, nextLocation]);

	const shouldBlock = blockerFn(args);

	useEffect(() => setBlockerState(shouldBlock ? 'charged' : 'unblocked'), [setBlockerState, shouldBlock]);

	const processHandler = useCallback(async () => {
		if (nextLocation) await navigate(nextLocation);
		setBlockerState('unblocked');
		setNextLocation(null);
	}, [navigate, nextLocation, setBlockerState, setNextLocation]);

	const resetHandler = useCallback(() => {
		setBlockerState('charged');
		setNextLocation(null);
	}, [setBlockerState, setNextLocation]);

	return {
		state: blockerState,
		process: processHandler,
		reset: resetHandler,
	};
};
