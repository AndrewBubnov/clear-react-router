import { useSyncExternalStore } from 'react';

type SetStateAction<T> = ((prevState: T) => Partial<T>) | Partial<T>;
type Listener<T> = (state: T, prevState: T) => void;
type Store<T> = {
	get: () => T;
	set: (action: SetStateAction<T>) => void;
	subscribe: (listener: Listener<T>) => () => void;

	use(): T;
	use<S>(selector: (state: T) => S): S;
	use<S>(selector?: (state: T) => S): T | S;
};
type StoreCreator<T> = (set: (action: SetStateAction<T>) => void, get: () => T) => T;

export const createStore = <T>(storeCreator: StoreCreator<T>): Store<T> => {
	let store: T;
	const subscribers = new Set<Listener<T>>();

	const get: Store<T>['get'] = () => store;
	const set: Store<T>['set'] = action => {
		const nextState = typeof action === 'function' ? action(store) : action;

		if (!Object.is(store, nextState)) {
			const prevState = store;
			store =
				typeof nextState !== 'object' || nextState === null ? nextState : Object.assign({}, store, nextState);
			console.log({ store });
			subscribers.forEach(listener => listener(store, prevState));
		}
	};

	store = storeCreator(set, get);

	const subscribe = (listener: Listener<T>) => {
		subscribers.add(listener);
		return () => subscribers.delete(listener);
	};

	function use(): T;
	function use<S>(selector: (state: T) => S): S;
	function use<S>(selector?: (state: T) => S): T | S {
		return useSyncExternalStore(subscribe, () => (selector ? selector(get()) : get()));
	}

	return {
		get,
		set,
		subscribe,
		use,
	};
};
