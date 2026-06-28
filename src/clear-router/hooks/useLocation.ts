import { useNavigationState } from './useServiceContext';

export const useLocation = () => {
	const {
		routeItemData: { location },
	} = useNavigationState();

	return location;
};
