import { useSyncExternalStore } from 'react';

type SetStateAction<T> = ((prevState: T) => T) | T;
type Listener<T> = (state: T, prevState: T) => void;

type Store<T> = {
	subscribe: (listener: Listener<T>) => () => void;
	getState: () => T;
	setState: (action: SetStateAction<T>) => void;
};

const create = <T>(initialState: T): Store<T> => {
	let state: T = initialState;
	const subscribers = new Set<Listener<T>>();

	const getState = () => state;
	const setState = (action: SetStateAction<T>) => {
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

const useGlobalState = <T>({ subscribe, getState, setState }: Store<T>) => {
	const state = useSyncExternalStore(subscribe, getState);
	return [state, setState] as const;
};

export const createState = <T>(initialState: T) => {
	const store = create(initialState);
	return () => useGlobalState(store);
};
