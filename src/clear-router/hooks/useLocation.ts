import { useNavigationState } from './useServiceContext.ts';

export const useLocation = () => {
	const context = useNavigationState();

	return context.location;
};
