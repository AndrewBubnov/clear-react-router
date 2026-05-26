import type { ReactElement } from 'react';

export type ClientRouteItem = {
	path: string;
	element: ReactElement;
	loader?(...args: unknown[]): Promise<unknown>;
	errorElement?: ReactElement;
	children?: ClientRouteItem[];
};

export type RouteItem = ClientRouteItem & {
	params?: string[];
};
