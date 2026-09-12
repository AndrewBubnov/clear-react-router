import { useCallback, useEffect, useMemo } from 'react';
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
		hooks: { useBlockerState, useContextState, useBlockedTargetState },
		runtime: { navigate },
	} = router;

	const [blockerState, setBlockerState] = useBlockerState();
	const [nextLocation, setNextLocation] = useBlockedTargetState();
	const [context] = useContextState();
	const location = useLocation();

	const args = useMemo(() => ({ location, nextLocation, context }), [context, location, nextLocation]);

	const shouldBlock = blockerFn(args);

	useEffect(() => setBlockerState(shouldBlock ? 'charged' : 'unblocked'), [setBlockerState, shouldBlock]);

	const processHandler = useCallback(async () => {
		if (nextLocation) await navigate(nextLocation);
		setNextLocation(null);
	}, [navigate, nextLocation, setNextLocation]);

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
