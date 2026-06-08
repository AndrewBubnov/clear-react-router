import { useEffect } from 'react';

export const useBeforeUnload = (callback: () => void) => {
	useEffect(() => {
		const handler = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			callback();
		};
		window.addEventListener('beforeunload', handler);
		return () => window.removeEventListener('beforeunload', handler);
	}, [callback]);
};
