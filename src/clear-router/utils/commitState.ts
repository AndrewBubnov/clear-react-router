import { Location, RouterState } from '../types';

export const createCommitState =
	({ statusState, loaderStateRef, loaderState }: RouterState) =>
	(nextLocation: Location) => {
		const isError = loaderStateRef.value.loaderError || loaderStateRef.value.beforeLoadError;
		statusState.setState(isError ? 'error' : 'active');
		loaderState.setState(loaderStateRef.value);
		const fullPath = nextLocation.search ? `${nextLocation.pathname}${nextLocation.search}` : nextLocation.pathname;
		if (fullPath === window.location.pathname + window.location.search) return;
		history.pushState(null, '', `${nextLocation.pathname}${nextLocation.search}`);
	};
