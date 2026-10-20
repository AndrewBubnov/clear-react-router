import { router } from '../instance';
import type { CacheSnapshot } from '../types';

export const useCacheSnapshot = (): CacheSnapshot => router.hooks.useCacheSnapshot();
