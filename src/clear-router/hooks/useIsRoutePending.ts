import { router } from '../instance';

export const useIsRoutePending = (routePath: string) => {
	const { useRouteDataSelector } = router.hooks;
	return useRouteDataSelector(({ location: { pathname }, status }) => pathname === routePath && status === 'pending');
};
