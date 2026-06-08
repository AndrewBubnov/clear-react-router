import { useServiceContext } from './useServiceContext.ts';

export const useLocation = () => {
	const context = useServiceContext('useLocation');

	return context.location;
};
