import { useRuntime } from './useRuntime.ts';

export const useInvalidate = () => {
	const { invalidate } = useRuntime();
	return invalidate;
};
