import { useContext } from 'react';
import { RouterViewContext } from '../context/RouterViewContext.ts';

export const useParams = <T>() => {
	const params = useContext(RouterViewContext);

	return params as T;
};
