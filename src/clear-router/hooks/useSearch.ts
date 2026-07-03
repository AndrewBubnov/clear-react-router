import { useEffect, useSyncExternalStore } from 'react';

const notify = () => {
	window.dispatchEvent(new Event('locationChange'));
};

export const patchHistory = () => {
	const push = history.pushState;
	const replace = history.replaceState;

	history.pushState = function (...args) {
		const result = push.apply(this, args);
		notify();
		return result;
	};

	history.replaceState = function (...args) {
		const result = replace.apply(this, args);
		notify();
		return result;
	};

	window.addEventListener('popstate', notify);
};

const subscribe = (onChange: () => void) => {
	window.addEventListener('locationChange', onChange);

	return () => window.removeEventListener('locationChange', onChange);
};

const getSnapshot = () => window.location.search;

export const useSearch = () => {
	useEffect(patchHistory, []);
	return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
