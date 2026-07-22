import type { ComponentType, Dispatch, ReactElement, ReactNode, SetStateAction } from 'react';
import { Store, useGlobalState } from './create';
import { Cell } from './cell';

export type LazyComponent = () => Promise<{ default: ComponentType<unknown> }>;

export type RenderElement = (() => ReactElement) | ReactElement;

export type BeforeLoad = (arg: {
	context: Record<string, unknown>;
	redirect: (arg: Location | string) => Promise<void>;
	params: Record<string, string>;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
}) => Promise<unknown> | undefined | void;

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
	beforeLoad?: BeforeLoad;
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
	routes: RouteItem[];
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
	beforeLoad?: ClientRouteItem['beforeLoad'];
	afterLoad?: ClientRouteItem['afterLoad'];
	context?: Record<string, unknown>;
};

export type RouterState = {
	isLoadingState: Store<boolean>;
	loaderFallbackState: Store<RouteItem['loaderFallback']>;
	routeItemDataState: Store<RouteItemData>;
	currentLoaderState: Store<LoaderState>;
	scrollMapState: Store<Record<string, number>>;
	contextState: Store<Record<string, unknown>>;
	blockedRouteState: Store<{ from: string; to: string }>;
	loaderStateRef: Cell<LoaderState>;
	prevPathnameRef: Cell<string>;
	timestampMap: Map<string, number>;
};

export type RouterType = {
	state: Omit<RouterState, 'loaderStateRef' | 'timestampMap'>;
	runtime: {
		navigate(arg: Location): Promise<void>;
		invalidate(pathList?: string | string[], options?: InvalidateOptions): Promise<void>;
		prefetch(pathname: string): Promise<void>;
	};
	hooks: {
		useIsLoading: () => ReturnType<typeof useGlobalState<boolean>>;
		useBlockedRoute: () => ReturnType<typeof useGlobalState<{ from: string; to: string }>>;
		useLoaderFallback: () => ReturnType<typeof useGlobalState<RenderElement | undefined>>;
		useRouteItemData: () => ReturnType<typeof useGlobalState<RouteItemData>>;
		useCurrentLoaderState: () => ReturnType<typeof useGlobalState<LoaderState<unknown>>>;
		useScrollMap: () => ReturnType<typeof useGlobalState<Record<string, number>>>;
		useContextState: () => ReturnType<typeof useGlobalState<Record<string, unknown>>>;
	};
};

export type InvalidateOptions = { withChildren?: boolean };
export type RevalidateCache = ({ routeItem, pathname }: RevalidateCacheArgs) => Promise<unknown> | undefined;
export type IsCacheItemFresh = ({ routeItem, pathname }: { routeItem?: RouteItem; pathname: string }) => boolean;
