import { useRouteItemData } from '../state/hooks.ts';
import { useRouter } from './useRouter.ts';

export const useLocation = () => {
	const router = useRouter();
	const [routeItemData] = useRouteItemData(router);

	return routeItemData.location;
};
