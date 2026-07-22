import { router } from '../instance';

export const useInvalidate = () => router.runtime.invalidate;
