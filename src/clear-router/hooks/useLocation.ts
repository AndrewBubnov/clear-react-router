import { useNavigationState } from './useServiceContext';

export const useLocation = () => {
	const context = useNavigationState();

	return context.location;
};
