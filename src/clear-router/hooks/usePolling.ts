import { RouteItem } from '../types.ts';
import { useEffect } from 'react';
import { useInvalidate } from './useInvalidate.ts';

export const usePolling = (routeItem: RouteItem | undefined) => {
	const invalidate = useInvalidate();
	useEffect(() => {
		const pollingInterval = routeItem?.pollingInterval;
		if (!pollingInterval) return;
		const interval = window.setInterval(() => invalidate(), pollingInterval);
		return () => window.clearInterval(interval);
	}, [invalidate, routeItem]);
};
