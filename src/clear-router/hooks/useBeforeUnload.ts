import { useEffect } from 'react';

export const useBeforeUnload = (callback?: () => void) => {
	useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			if (!callback) return;
			event.preventDefault();
			callback();
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [callback]);
};
