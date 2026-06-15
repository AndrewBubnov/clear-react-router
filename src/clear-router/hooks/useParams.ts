import { useNavigationState } from './useServiceContext';

export const useParams = <T>() => {
	const { params } = useNavigationState();

	return params as T;
};
