import { useEffect, useRef } from 'react';
import { useRouterContext } from './useRouterContext.ts';
import type { BlockerState } from '../types.ts';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

export const useBlocker = (blockerFn: () => boolean): UseBlockerReturnValue => {
	const memoizedBlockerFn = useRef(blockerFn);

	const {
		updateBlockedRoute,
		location: { pathname },
		blockerState,
	} = useRouterContext();

	useEffect(() =>
		updateBlockedRoute(memoizedBlockerFn.current() ? { type: 'charge', payload: pathname } : { type: 'unblock' })
	);

	return {
		state: blockerState,
		process: () => updateBlockedRoute({ type: 'process' }),
		reset: () => updateBlockedRoute({ type: 'reset' }),
	};
};
