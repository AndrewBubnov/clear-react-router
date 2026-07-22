import { emptyLoaderState } from './constants';

export class Cell<T> {
	constructor(private _value: T) {}

	get value() {
		return this._value;
	}

	set(action: T | ((prev: T) => T)) {
		this._value = typeof action === 'function' ? (action as (prev: T) => T)(this._value) : action;
	}
}

export const loaderStateRef = new Cell(emptyLoaderState);
export const prevPathnameRef = new Cell('');
export const timestampMap: Map<string, number> = new Map();
