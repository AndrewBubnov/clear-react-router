import { useEffect } from 'react';
import { router } from '../instance';
import { ScrollRestorationBehavior } from '../types';

export const usePreserveScroll = (restorationBehavior: ScrollRestorationBehavior) => {
	const { useRestoreScroll } = router.hooks;
	const restoreScroll = useRestoreScroll(restorationBehavior);
	useEffect(() => {
		restoreScroll?.();
	}, [restoreScroll]);
};
