import { useEffect } from 'react';
import { useRouterContext } from './useRouterContext.ts';
import type { BlockerState } from '../types.ts';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

export const useBlocker = (blockerFn: () => boolean): UseBlockerReturnValue => {
	const {
		updateBlockedRoute,
		location: { pathname },
		blockerState,
	} = useRouterContext();

	useEffect(
		() => updateBlockedRoute(blockerFn() ? { type: 'charge', payload: pathname } : { type: 'unblock' }),
		[blockerFn, pathname, updateBlockedRoute]
	);

	return {
		state: blockerState,
		process: () => updateBlockedRoute({ type: 'process' }),
		reset: () => updateBlockedRoute({ type: 'reset' }),
	};
};
