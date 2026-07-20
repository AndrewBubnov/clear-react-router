import type { ComponentType, Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
import { Store } from '../state/createState';
import { Cell } from '../cell';

export type LazyComponent = () => Promise<{ default: ComponentType<unknown> }>;

export type RenderElement = (() => ReactElement) | ReactElement;

export type ClientRouteItem = {
	path: string;
	element: RenderElement | LazyComponent;
	loader?(arg: {
		params: Record<string, string>;
		context: Record<string, unknown>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}): Promise<unknown>;
	loaderFallback?: RenderElement;
	errorElement?: RenderElement;
	fallback?: RenderElement;
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
	element: RenderElement;
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
	router: RouterType;
	isAnimated?: boolean;
	animationDuration?: number;
	spinner?: boolean;
	preserveScroll?: boolean;
	defaultLoaderFallback?: RenderElement;
	defaultErrorElement?: RenderElement;
	showFallbackOnAnimation?: boolean;
	prefetch?: 'hover' | 'render' | 'viewport' | 'none';
	hoverPrefetchDelay?: number;
	errorBoundary?: ComponentType<{ children: ReactNode }>;
	context?: Record<string, unknown>;
};

export type RouterType = {
	routes: RouteItem[];
	state: {
		isLoadingState: Store<boolean>;
		loaderFallbackState: Store<RouteItem['loaderFallback']>;
		routeItemDataState: Store<RouteItemData>;
		currentLoaderState: Store<LoaderState>;
		scrollMapState: Store<Record<string, number>>;
		contextState: Store<Record<string, unknown>>;
	};
	cell: {
		loaderStateRef: Cell<LoaderState>;
		prevPathnameRef: Cell<string>;
		timestampMap: Map<string, number>;
	};
};
