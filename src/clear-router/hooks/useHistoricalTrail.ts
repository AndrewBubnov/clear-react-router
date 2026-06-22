import { useLocation } from './useLocation.ts';
import { useEffect, useState } from 'react';

export const useHistoricalTrail = () => {
	const { pathname } = useLocation();
	const [trail, setTrail] = useState<string[]>([]);

	useEffect(() => {
		if (!pathname) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setTrail(prevState => {
			const index = prevState.indexOf(pathname);
			return index === -1 ? [...prevState, pathname] : prevState.slice(0, index + 1);
		});
	}, [pathname]);

	return trail;
};
