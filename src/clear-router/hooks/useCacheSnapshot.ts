import { useEffect } from 'react';
import { router } from '../instance';
import type { CacheSnapshot } from '../types';

/** Requires `<Router logged>` — otherwise the snapshot stays empty. */
export const useCacheSnapshot = (): CacheSnapshot => {
	const snapshot = router.hooks.useCacheSnapshot();
	useEffect(() => router.runtime.syncCacheSnapshot(), []);
	return snapshot;
};
