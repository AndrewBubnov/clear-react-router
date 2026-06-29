import { useEffect } from 'react';
import { useNavigationState, useRouterActions } from './useServiceContext';

export const usePreserveScroll = (preserveScroll: boolean) => {
	const { restoreScroll } = useRouterActions();
	const {
		routeItemData: {
			location: { pathname },
		},
	} = useNavigationState();

	useEffect(() => {
		if (preserveScroll) restoreScroll();
	}, [preserveScroll, restoreScroll, pathname]);
};
