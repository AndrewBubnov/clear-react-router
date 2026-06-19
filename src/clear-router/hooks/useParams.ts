import { useContext } from 'react';
import { RouterViewContext } from '../context/RouterViewContext';

export const useParams = <T>() => {
	const params = useContext(RouterViewContext);

	return params as T;
};
