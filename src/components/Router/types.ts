import type { ReactElement } from 'react';

export type RouteItem = {
	path: string;
	element: ReactElement;
	loader?(...args: unknown[]): Promise<unknown>;
	errorElement?: ReactElement;
};
