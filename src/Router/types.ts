import type { ReactElement } from 'react';

export type ClientRouteItem = {
	path: string;
	element: (() => ReactElement) | ReactElement;
	loader?(...args: unknown[]): Promise<unknown>;
	fallback?: (() => ReactElement) | ReactElement;
	errorElement?: (() => ReactElement) | ReactElement;
	children?: ClientRouteItem[];
	staleTime?: number;
	beforeLoad?: () => Promise<unknown>;
	afterLoad?: () => Promise<unknown>;
};

export type RouteItem = ClientRouteItem & {
	params?: { key: string; value: string }[];
	cacheTimestamp?: number;
};

export type Location = {
	pathname: string;
	search?: string;
	state?: unknown;
};

export type BlockerState = 'blocked' | 'unblocked' | 'charged';

export type UpdateBlockedRouteProps = { type: 'process' | 'reset' | 'charge' | 'unblock'; payload?: string };
