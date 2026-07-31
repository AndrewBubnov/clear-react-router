import { useEffect } from 'react';
import { router } from '../instance';

export const useCleanupStaleTime = () => {
	useEffect(
		() => () => {
			router.state.reloadMap.forEach(el => {
				window.clearTimeout(el);
			});
		},
		[]
	);
};
