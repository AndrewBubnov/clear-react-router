import { useRuntime } from './useRuntime';

export const useInvalidate = () => {
	const { invalidate } = useRuntime();
	return invalidate;
};
