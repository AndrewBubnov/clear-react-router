import type { SetStateFn, Synchronizer } from './types';

type Listener<T> = (state: T, prevState: T) => void;

export type Store<T> = {
	subscribe: (listener: Listener<T>) => () => void;
	getState: () => T;
	setState: SetStateFn<T>;
};

export const create = <T>(initialState: T): Store<T> => {
	let state: T = initialState;
	const subscribers = new Set<Listener<T>>();

	const getState = () => state;
	const setState: SetStateFn<T> = action => {
		const prevState = state;
		const nextState = typeof action === 'function' ? (action as (prev: T) => T)(state) : action;
		if (!Object.is(state, nextState)) {
			state = nextState;
			subscribers.forEach(listener => listener(state, prevState));
		}
	};

	const subscribe = (listener: Listener<T>) => {
		subscribers.add(listener);
		return () => subscribers.delete(listener);
	};

	return { subscribe, getState, setState };
};

export const useGlobalState = <T>({ subscribe, getState, setState }: Store<T>, synchronizer: Synchronizer) => {
	const state = synchronizer(subscribe, getState);
	return [state, setState] as const;
};
