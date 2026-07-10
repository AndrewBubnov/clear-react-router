import { useEffect, useMemo } from 'react';
import { useBlockedRoute, useRouteItemData } from '../state/state';
import { useRouterActions } from './useServiceContext';
import type { BlockerState } from '../types/global';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

export const useBlocker = (blockerFn: () => boolean): UseBlockerReturnValue => {
	const [blockedRoute] = useBlockedRoute();

	const [routeItemData] = useRouteItemData();
	const {
		location: { pathname },
	} = routeItemData;

	const { updateBlockedRoute } = useRouterActions();

	const blockerState: BlockerState = useMemo(() => {
		if (blockedRoute.from && blockedRoute.to) return 'blocked';
		if (blockedRoute.from) return 'charged';
		return 'unblocked';
	}, [blockedRoute]);

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
