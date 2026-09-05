import { useEffect } from 'react';
import { router } from '../instance';
import { parseWindowLocation } from '../utils/utils';

export const useNavigation = () => {
	const { navigate } = router.runtime;

	useEffect(() => {
		const handler = async (event: PopStateEvent) => {
			const newLocation = parseWindowLocation((event.target as Window).location);
			navigate(newLocation);
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, [navigate]);

	useEffect(() => {
		navigate(parseWindowLocation(window.location));
	}, [navigate]);
};
