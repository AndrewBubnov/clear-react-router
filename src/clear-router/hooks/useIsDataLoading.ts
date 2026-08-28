import { router } from '../instance';

export const useIsDataLoading = () => {
	const { useStatus } = router.hooks;
	const [status] = useStatus();
	return status === 'pending';
};
