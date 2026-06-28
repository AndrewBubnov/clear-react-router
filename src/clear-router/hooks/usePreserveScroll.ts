import { useEffect } from 'react';
import { useRouterActions } from './useServiceContext.ts';

export const usePreserveScroll = (preserveScroll: boolean, pathname: string) => {
	const { restoreScroll } = useRouterActions();

	useEffect(() => {
		if (preserveScroll) restoreScroll();
	}, [preserveScroll, restoreScroll, pathname]);
};
