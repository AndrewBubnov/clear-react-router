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
import { Cell } from './cell';

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
	}): Promise<unknown>;
	loaderFallback?: RenderElement;
	errorElement?: RenderElement;
	fallback?: RenderElement;
	children?: ClientRouteItem[];
	staleTime?: number;
	optimistic?: boolean;
	pollingInterval?: number;
	retry?: Retry;
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
	spinner?: boolean;
	defaultPreserveScroll?: boolean;
	defaultRetry?: Retry;
	defaultStaleTime?: number;
	defaultLoaderFallback?: RenderElement;
	defaultErrorElement?: RenderElement;
	showFallbackOnAnimation?: boolean;
	defaultPrefetch?: 'hover' | 'render' | 'viewport' | 'none';
	defaultHoverPrefetchDelay?: number;
	errorBoundary?: ComponentType<{ children: ReactNode }>;
	defaultBeforeLoad?: ClientRouteItem['beforeLoad'];
	defaultAfterLoad?: ClientRouteItem['afterLoad'];
	context?: Record<string, unknown>;
};

export type LoaderStateItem = { state: LoaderState; timestamp: number; staleTime: number | undefined };

export type RouterState = {
	routeItemDataState: Store<RouteItemData>;
	pendingState: Store<RouteItemData | undefined>;
	currentLoaderState: Store<LoaderState>;
	scrollMapState: Store<Record<string, number>>;
	contextState: Store<Record<string, unknown>>;
	blockedRouteState: Store<{ from: string; to: string }>;
	loaderStateRef: Cell<LoaderState>;
	loaderMap: Map<string, LoaderStateItem>;
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

export type InvalidateOptions = { withChildren?: boolean; withBeforeLoad?: boolean };
export type RevalidateCache = (args: RevalidateCacheArgs) => Promise<{ data: unknown; error: unknown }>;
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
