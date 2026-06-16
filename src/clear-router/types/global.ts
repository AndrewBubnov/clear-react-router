import type { ComponentType, ReactElement } from 'react';

export type LazyComponent = () => Promise<{ default: ComponentType<unknown> }>;

export type ClientRouteItem = {
	path: string;
	element: (() => ReactElement) | ReactElement | LazyComponent;
	loader?(arg: { params: Record<string, string>; context: Record<string, unknown> }): Promise<unknown>;
	loaderFallback?: (() => ReactElement) | ReactElement;
	errorElement?: (() => ReactElement) | ReactElement;
	fallback?: (() => ReactElement) | ReactElement;
	children?: ClientRouteItem[];
	staleTime?: number;
	beforeLoad?: (arg: {
		context: Record<string, unknown>;
		redirect: (arg: Location) => Promise<void>;
		params: Record<string, string>;
	}) => Promise<unknown> | undefined;
	afterLoad?: (arg: { context: Record<string, unknown>; params: Record<string, string> }) => Promise<void>;
};

export type RouteItem = ClientRouteItem & {
	element: (() => ReactElement) | ReactElement;
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

export type AnimationOptions = {
	duration?: number;
	name?: 'fade' | 'slide-left' | 'slide-right';
};

export type RevalidateCacheArgs = {
	pathname: string;
	routeItem?: RouteItem;
	isCurrentRoute?: boolean;
};
