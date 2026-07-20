import { useCallback, useEffect, useMemo } from 'react';
import { useBlockedRoute, useRouteItemData } from '../state/hooks.ts';
import { BlockerState } from '../types/global';
import { useRouter } from './useRouter.ts';

type UseBlockerReturnValue = {
	state: BlockerState;
	process(): void;
	reset(): void;
};

type UpdateBlockedRouteProps = { type: 'process' | 'reset' | 'charge' | 'unblock'; payload?: string };

export const useBlocker = (blockerFn: () => boolean): UseBlockerReturnValue => {
	const router = useRouter();
	const [blockedRoute, setBlockedRoute] = useBlockedRoute(router);

	const [routeItemData] = useRouteItemData(router);
	const {
		location: { pathname },
	} = routeItemData;

	const updateBlockedRoute = useCallback(
		({ type, payload = '' }: UpdateBlockedRouteProps) =>
			setBlockedRoute(prevState => {
				if (prevState.from === payload && type === 'charge') return prevState;
				if (payload && prevState.from !== payload && type === 'charge') return { ...prevState, from: payload };
				if (type === 'reset') return { ...prevState, to: '' };
				if (type === 'process') router.runtime.navigate({ pathname: prevState.to });
				if (!prevState.from && !prevState.to) return prevState;
				return { from: '', to: '' };
			}),
		[router.runtime, setBlockedRoute]
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
