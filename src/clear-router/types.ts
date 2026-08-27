import {
	ComponentType,
	type CSSProperties,
	Dispatch,
	MouseEvent,
	ReactElement,
	ReactNode,
	Ref,
	SetStateAction,
} from 'react';
import { Store, useGlobalState } from './create';

export const LAZY_MARKER = Symbol('clear-router-lazy');

export type LazyComponent = {
	readonly [LAZY_MARKER]: true;
	importFn: () => Promise<{ default: ComponentType<unknown> }>;
};

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
		searchParams: Record<string, string>;
		signal: AbortSignal;
	}): Promise<unknown>;
	loaderFallback?: RenderElement;
	errorElement?: RenderElement;
	fallback?: RenderElement;
	children?: ClientRouteItem[];
	staleTime?: number;
	optimistic?: boolean;
	pollingInterval?: number;
	retry?: Retry;
	minLoaderDuration?: number;
	preserveScroll?: boolean;
	beforeLoad?: BeforeLoad;
	afterLoad?: (arg: {
		context: Record<string, unknown>;
		params: Record<string, string>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}) => Promise<void>;
	actions?: (arg: {
		context: Record<string, unknown>;
		params: Record<string, string>;
		invalidate: (path?: string) => Promise<InvalidateResult[]>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}) => Record<string, (arg: FormData) => Promise<unknown> | Promise<void> | void | unknown>;
};

export type RouteItem = ClientRouteItem & {
	element: RenderElement;
	pattern: string;
	cacheTimestamp?: number;
	preloadElement?(): Promise<{ default: ComponentType<unknown> }>;
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
	search?: string;
	signal?: AbortSignal;
};

export type LoaderState<T = unknown> = {
	data: T;
	loaderError: Error | null;
	beforeLoadError: Error | null;
};

export type RouteItemData = {
	location: Location;
	routeItem: RouteItem | undefined;
};

type ObjectRetry = { count: number; delay: number };

export type Retry = number | ObjectRetry | undefined;

export type RouterProps = {
	routes: RouteItem[];
	isAnimated?: boolean;
	animationDuration?: number;
	optimisticSpinner?: boolean;
	defaultPreserveScroll?: boolean;
	defaultRetry?: Retry;
	defaultStaleTime?: number;
	defaultLoaderFallback?: RenderElement;
	defaultErrorElement?: RenderElement;
	defaultPrefetch?: 'hover' | 'render' | 'viewport' | 'none';
	defaultHoverPrefetchDelay?: number;
	defaultMinLoaderDuration?: number;
	maxCacheSize?: number;
	errorBoundary?: ComponentType<{ children: ReactNode }>;
	defaultBeforeLoad?: ClientRouteItem['beforeLoad'];
	defaultAfterLoad?: ClientRouteItem['afterLoad'];
	context?: Record<string, unknown>;
};

export type LoaderStateItem = { state: LoaderState; timestamp: number; staleTime: number | undefined };

export type LoadingPromise = Promise<{ data: unknown; error: null } | { data: null; error: unknown } | undefined>;

export type RouterState = {
	routeItemDataState: Store<RouteItemData>;
	pendingState: Store<RouteItemData | undefined>;
	scrollMapState: Store<Record<string, number>>;
	contextState: Store<Record<string, unknown>>;
	blockedRouteState: Store<{ from: string; to: string }>;
	isOptimisticLoading: Store<boolean>;
	loaderState: Store<LoaderState>;
	loaderMap: Map<string, LoaderStateItem>;
	loadingPromises: Map<string, LoadingPromise>;
};

export type RouterType = {
	state: Omit<RouterState, 'timestampMap'>;
	runtime: {
		navigate(arg: Location): Promise<void>;
		invalidate(pathList?: string | string[], options?: InvalidateOptions): Promise<InvalidateResult[]>;
		prefetch(pathname: string): Promise<void>;
	};
	hooks: {
		useBlockedRoute: () => ReturnType<typeof useGlobalState<{ from: string; to: string }>>;
		useRouteItemData: () => ReturnType<typeof useGlobalState<RouteItemData>>;
		useScrollMap: () => ReturnType<typeof useGlobalState<Record<string, number>>>;
		usePendingState: () => ReturnType<typeof useGlobalState<RouteItemData | undefined>>;
		useContextState: () => ReturnType<typeof useGlobalState<Record<string, unknown>>>;
		useOptimisticLoading: () => ReturnType<typeof useGlobalState<boolean>>;
		useParams: <T>() => T;
		useNavigate: () => (arg: Location | string | -1) => Promise<void>;
		useGetAction: (actionKey: string) => {
			currentAction: (arg: FormData) => Promise<unknown> | Promise<void> | void | unknown;
			invalidate: (pathList?: string | string[], options?: InvalidateOptions) => Promise<InvalidateResult[]>;
		};
		useRestoreScroll: () => () => void;
		useAction: (action: string, options?: Options) => (arg: FormData) => Promise<void>;
	};
};

export type InvalidateOptions = { withChildren?: boolean; withBeforeLoad?: boolean; force?: boolean };
export type RevalidateCache = (args: RevalidateCacheArgs) => LoadingPromise;
export type Options =
	| Partial<{
			onSuccess: (args: unknown) => void;
			onError: (args: unknown) => void;
	  }>
	| undefined;

export type InvalidateResult = { path: string; data: unknown };

export type ElementProps<T extends HTMLElement = HTMLElement> = {
	ref: Ref<T>;
	href: string;
	className?: string;
	style?: CSSProperties;
	onClick(event: MouseEvent): void;
	onMouseEnter(event: MouseEvent): void;
	onMouseLeave(event: MouseEvent): void;
	children?: ReactNode;
};
