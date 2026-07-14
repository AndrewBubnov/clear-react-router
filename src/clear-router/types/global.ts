import type { ComponentType, Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';

export type LazyComponent = () => Promise<{ default: ComponentType<unknown> }>;

type Element = (() => ReactElement) | ReactElement;

export type ClientRouteItem = {
	path: string;
	element: Element | LazyComponent;
	loader?(arg: {
		params: Record<string, string>;
		context: Record<string, unknown>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}): Promise<unknown>;
	loaderFallback?: Element;
	errorElement?: Element;
	fallback?: Element;
	children?: ClientRouteItem[];
	staleTime?: number;
	beforeLoad?: (arg: {
		context: Record<string, unknown>;
		redirect: (arg: Location | string) => Promise<void>;
		params: Record<string, string>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}) => Promise<unknown> | undefined | void;
	afterLoad?: (arg: {
		context: Record<string, unknown>;
		params: Record<string, string>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}) => Promise<void>;
	actions?: (arg: {
		context: Record<string, unknown>;
		params: Record<string, string>;
		invalidate: (path?: string) => Promise<void>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}) => Record<string, (arg: FormData) => Promise<unknown> | Promise<void> | void | unknown>;
};

export type RouteItem = ClientRouteItem & {
	element: Element;
	params?: { key: string; value: string }[];
	cacheTimestamp?: number;
};

export type Location = {
	pathname: string;
	search?: string;
	state?: unknown;
};

export type BlockerState = 'blocked' | 'unblocked' | 'charged';

export type RevalidateCacheArgs = {
	pathname: string;
	routeItem?: RouteItem;
};

export type LoaderState<T = unknown> = {
	data: T;
	loaderError: Error | null;
	beforeLoadError: Error | null;
};

export type Adapter<T> = {
	parse: (params: string[]) => T;
	serialize?: (params: T) => string | string[];
};

export type RouteItemData = {
	location: Location;
	routeItem: RouteItem | undefined;
};

export type RouterProps = {
	routes: RouteItem[];
	isAnimated?: boolean;
	animationDuration?: number;
	spinner?: boolean;
	preserveScroll?: boolean;
	showFallbackOnAnimation?: boolean;
	prefetch?: 'hover' | 'render' | 'viewport' | 'none';
	hoverPrefetchDelay?: number;
	errorBoundary?: ComponentType<{ children: ReactNode }>;
	context?: Record<string, unknown>;
};
