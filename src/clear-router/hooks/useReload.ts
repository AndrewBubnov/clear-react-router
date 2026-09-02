import { useEffect } from 'react';
import { router } from '../instance';
import { RouteItem } from '../types';

export const useReload = (routeItem?: RouteItem) => {
	const { invalidate } = router.runtime;

	useEffect(() => {
		if (!routeItem?.revalidateOnFocus) return;
		const handler = () => {
			if (document.visibilityState === 'visible') invalidate('', { staleOnly: true });
		};
		document.addEventListener('visibilitychange', handler);
		return () => document.removeEventListener('visibilitychange', handler);
	}, [invalidate, routeItem?.revalidateOnFocus]);

	useEffect(() => {
		if (routeItem?.revalidateOnReconnect === false) return;
		const handler = () => invalidate('', { staleOnly: true });
		window.addEventListener('online', handler);
		return () => document.removeEventListener('online', handler);
	}, [invalidate, routeItem?.revalidateOnReconnect]);
};
