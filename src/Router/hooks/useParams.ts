import { useRouterContext } from './useRouterContext.ts';

export const useParams = <T>() => {
	const { params } = useRouterContext('useLocation');

	return params as T;
};
