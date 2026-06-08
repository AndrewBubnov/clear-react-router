import { useServiceContext } from './useServiceContext.ts';

export const useParams = <T>() => {
	const { params } = useServiceContext('useLocation');

	return params as T;
};
