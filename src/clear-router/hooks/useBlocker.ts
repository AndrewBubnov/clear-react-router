import { useCallback, useEffect, useMemo } from 'react';
import { useBlockedRoute, useRouteItemData } from '../state/state';
import { useRouterCallback } from './useRouterCallback';
import { BlockerState } from '../types/global';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

type UpdateBlockedRouteProps = { type: 'process' | 'reset' | 'charge' | 'unblock'; payload?: string };

export const useBlocker = (blockerFn: () => boolean): UseBlockerReturnValue => {
	const [blockedRoute, setBlockedRoute] = useBlockedRoute();
	const { updateLocation } = useRouterCallback();

	const [routeItemData] = useRouteItemData();
	const {
		location: { pathname },
	} = routeItemData;

	const updateBlockedRoute = useCallback(
		({ type, payload = '' }: UpdateBlockedRouteProps) =>
			setBlockedRoute(prevState => {
				if (prevState.from === payload && type === 'charge') return prevState;
				if (payload && prevState.from !== payload && type === 'charge') return { ...prevState, from: payload };
				if (type === 'reset') return { ...prevState, to: '' };
				if (type === 'process') updateLocation({ pathname: prevState.to });
				if (!prevState.from && !prevState.to) return prevState;
				return { from: '', to: '' };
			}),
		[setBlockedRoute, updateLocation]
	);

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
