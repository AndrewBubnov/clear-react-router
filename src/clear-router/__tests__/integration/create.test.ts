import { describe, it, expect, vi } from 'vitest';
import { useSyncExternalStore } from 'react';
import { create, useGlobalState } from '../../create';
import { act, renderHook } from '@testing-library/react';

describe('create store', () => {
	it('creates store with initial state', () => {
		const store = create({ count: 0 });
		expect(store.getState()).toEqual({ count: 0 });
	});

	it('updates state with setState (object)', () => {
		const store = create({ count: 0 });
		store.setState({ count: 1 });
		expect(store.getState()).toEqual({ count: 1 });
	});

	it('updates state with setState (function)', () => {
		const store = create({ count: 0 });
		store.setState(prev => ({ count: prev.count + 1 }));
		expect(store.getState()).toEqual({ count: 1 });
	});

	it('notifies subscribers on state change', () => {
		const store = create({ count: 0 });
		const listener = vi.fn();
		const unsubscribe = store.subscribe(listener);

		store.setState({ count: 1 });
		expect(listener).toHaveBeenCalledWith({ count: 1 }, { count: 0 });

		unsubscribe();
		store.setState({ count: 2 });
		expect(listener).toHaveBeenCalledTimes(1);
	});

	it('does not notify when state is unchanged (Object.is)', () => {
		const initialState = { count: 0 };
		const store = create(initialState);
		const listener = vi.fn();
		store.subscribe(listener);

		store.setState(initialState);
		expect(listener).not.toHaveBeenCalled();
	});

	it('supports multiple subscribers', () => {
		const store = create({ count: 0 });
		const listener1 = vi.fn();
		const listener2 = vi.fn();

		store.subscribe(listener1);
		store.subscribe(listener2);

		store.setState({ count: 1 });
		expect(listener1).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
		expect(listener2).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
	});

	it('unsubscribe removes specific listener', () => {
		const store = create({ count: 0 });
		const listener1 = vi.fn();
		const listener2 = vi.fn();

		const unsubscribe1 = store.subscribe(listener1);
		store.subscribe(listener2);

		unsubscribe1();
		store.setState({ count: 1 });

		expect(listener1).not.toHaveBeenCalled();
		expect(listener2).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
	});
});

describe('useGlobalState hook', () => {
	it('returns current state and setState', () => {
		const store = create({ count: 0 });
		const { result } = renderHook(() => useGlobalState(store, useSyncExternalStore));

		expect(result.current[0]).toEqual({ count: 0 });
		expect(typeof result.current[1]).toBe('function');
	});

	it('updates state via setState from hook', () => {
		const store = create({ count: 0 });
		const { result } = renderHook(() => useGlobalState(store, useSyncExternalStore));

		act(() => {
			result.current[1]({ count: 5 });
		});

		expect(result.current[0]).toEqual({ count: 5 });
	});

	it('reacts to external store updates', () => {
		const store = create({ count: 0 });
		const { result } = renderHook(() => useGlobalState(store, useSyncExternalStore));

		act(() => {
			store.setState({ count: 10 });
		});

		expect(result.current[0]).toEqual({ count: 10 });
	});
});
