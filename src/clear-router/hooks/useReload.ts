import { useEffect } from 'react';
import { router } from '../instance';
import { routerConfig } from '../config/routerConfig';

export const useReload = () => {
	const { invalidate } = router.runtime;

	useEffect(() => {
		if (!routerConfig.revalidateOnFocus) return;
		const handler = () => {
			if (document.visibilityState === 'visible') invalidate('', { staleOnly: true });
		};
		document.addEventListener('visibilitychange', handler);
		return () => document.removeEventListener('visibilitychange', handler);
	}, [invalidate]);

	useEffect(() => {
		if (!routerConfig.revalidateOnReconnect) return;
		const handler = () => invalidate('', { staleOnly: true });
		window.addEventListener('online', handler);
		return () => document.removeEventListener('online', handler);
	}, [invalidate]);
};
