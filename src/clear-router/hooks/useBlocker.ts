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

export const useBlocker = (blockerFn: (args: BlockerCallback) => boolean): UseBlockerReturnValue => {
	const {
		hooks: { useBlockerState, useContextState },
		runtime: { navigate },
		state: { blockedTargetState },
	} = router;

	const [nextLocation, setNextLocation] = useGlobalState(blockedTargetState);
	const [blockerState, setBlockerState] = useBlockerState();
	const [context] = useContextState();
	const location = useLocation();

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
