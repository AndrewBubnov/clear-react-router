import { useEffect } from 'react';
import { useNavigationState, useRouterActions } from './useServiceContext';
import type { BlockerState } from '../types/global.ts';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

export const useBlocker = (blockerFn: () => boolean): UseBlockerReturnValue => {
	const {
		location: { pathname },
		blockerState,
	} = useNavigationState();

	const { updateBlockedRoute } = useRouterActions();

	const shouldBlock = blockerFn();

	useEffect(
		() => updateBlockedRoute(shouldBlock ? { type: 'charge', payload: pathname } : { type: 'unblock' }),
		[shouldBlock, pathname, updateBlockedRoute]
	);

	return {
		state: blockerState,
		process: () => updateBlockedRoute({ type: 'process' }),
		reset: () => updateBlockedRoute({ type: 'reset' }),
	};
};
