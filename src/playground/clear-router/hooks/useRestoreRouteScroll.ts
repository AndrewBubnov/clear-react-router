import { useEffect } from 'react';
import { useRestoreScroll } from './useRestoreScroll';
import { ScrollRestorationBehavior } from '../types';

export const useRestoreRouteScroll = (behavior?: ScrollRestorationBehavior) => {
	const restoreScroll = useRestoreScroll(behavior);
	useEffect(restoreScroll, [restoreScroll]);
};
