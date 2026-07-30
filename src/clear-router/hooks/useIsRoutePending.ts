import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const {
		hooks: { useIsLoading },
		state: { pendingPathRef },
	} = router;
	const [isPending] = useIsLoading();
	return isPending && pendingPathRef.value === routePath;
};
