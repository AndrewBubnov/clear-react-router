import { useNavigationState } from './useServiceContext.ts';

export const useParams = <T>() => {
	const { params } = useNavigationState();

	return params as T;
};
