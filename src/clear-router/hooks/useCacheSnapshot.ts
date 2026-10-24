import { useEffect } from 'react';
import { router } from '../instance';
import type { CacheSnapshot } from '../types';

export const useCacheSnapshot = (): CacheSnapshot => {
	const snapshot = router.hooks.useCacheSnapshot();
	useEffect(() => router.runtime.syncCacheSnapshot(), []);
	return snapshot;
};
