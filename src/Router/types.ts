import type { ReactElement } from 'react';

export type ClientRouteItem = {
	path: string;
	element: ReactElement;
	loader?(...args: unknown[]): Promise<unknown>;
	fallback?: ReactElement;
	errorElement?: ReactElement;
	children?: ClientRouteItem[];
};

export type RouteItem = ClientRouteItem & {
	params?: { key: string; value: string }[];
};

export type Location = {
	pathname: string;
	search?: string;
	state?: unknown;
};
