import { useRouter } from './useRouter';

export const useInvalidate = () => {
	const router = useRouter();
	return router.runtime.invalidate;
};
