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

type LoaderArgs = {
	context: Record<string, unknown>;
	params: Record<string, string>;
	setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	searchParams: Record<string, string>;
	location: Location;
};

export type BeforeLoad = (
	arg: LoaderArgs & { redirect: (arg: Location | string) => Promise<void> }
) => Promise<unknown> | undefined | void;

export type ScrollRestorationBehavior = 'auto' | 'smooth' | 'instant';

export type ClientRouteItem = {
	path: string;
	element: RenderElement | LazyComponent;
	loader?(
		arg: LoaderArgs & {
			signal: AbortSignal;
		}
	): Promise<unknown>;
	loaderFallback?: RenderElement;
	errorElement?: RenderElement;
	fallback?: RenderElement;
	children?: ClientRouteItem[];
	staleTime?: number;
	optimistic?: boolean;
	pollingInterval?: number;
	retry?: Retry;
	minLoaderDuration?: number;
	scrollRestoration?: boolean | string[];
	scrollRestorationBehavior?: ScrollRestorationBehavior;
	beforeLoad?: BeforeLoad;
	afterLoad?: (arg: {
		context: Record<string, unknown>;
		params: Record<string, string>;
		setContext: Dispatch<SetStateAction<Record<string, unknown>>>;
	}) => Promise<void>;
	actions?: (arg: LoaderArgs) => Record<string, (arg: FormData) => Promise<unknown> | Promise<void> | void | unknown>;
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
	location: Location;
	routeItem?: RouteItem;
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
	defaultScrollRestorationBehavior?: ScrollRestorationBehavior;
	context?: Record<string, unknown>;
};

export type LoaderStateItem = { state: LoaderState; timestamp: number; staleTime: number | undefined };

export type LoadingPromise = Promise<{ data: unknown; error: null } | { data: null; error: unknown } | undefined>;

export type Status = 'idle' | 'pending' | 'active' | 'optimistic';

export type ScrollMap = Record<string, [string, number][]>;

export type RouterState = {
	routeItemDataState: Store<RouteItemData>;
	statusState: Store<Status>;
	scrollMapState: Store<ScrollMap>;
	contextState: Store<Record<string, unknown>>;
	blockedRouteState: Store<{ from: string; to: string }>;
	loaderState: Store<LoaderState>;
	loaderStateRef: Cell<LoaderState>;
	loaderMap: Map<string, LoaderStateItem>;
	loadingPromises: Map<string, LoadingPromise>;
};

export type RouterType = {
	state: Omit<RouterState, 'timestampMap'>;
	runtime: {
		navigate(arg: Location): Promise<void>;
		invalidate(pathList?: string | string[], options?: InvalidateOptions): Promise<InvalidateResult[]>;
		prefetch(location: Location): Promise<void>;
	};
	hooks: {
		useBlockedRoute(): ReturnType<typeof useGlobalState<{ from: string; to: string }>>;
		useRouteItemData(): ReturnType<typeof useGlobalState<RouteItemData>>;
		useScrollMap(): ReturnType<typeof useGlobalState<ScrollMap>>;
		useStatus(): ReturnType<typeof useGlobalState<Status>>;
		useContextState(): ReturnType<typeof useGlobalState<Record<string, unknown>>>;
		useLoaderState<T>(): LoaderState<T>;
		useParams<T>(): T;
		useNavigate(): (arg: Location | string | -1) => Promise<void>;
		useAction(
			action: string,
			options?: Options
		): (arg: FormData) => Promise<{ data: unknown; error: Error | null }>;
		useRestoreScroll(restorationBehavior: ScrollRestorationBehavior): (() => void) | undefined;
	};
};

export type InvalidateOptions = { withChildren?: boolean; withBeforeLoad?: boolean; force?: boolean };
export type RevalidateCache = (args: RevalidateCacheArgs) => LoadingPromise;
export type Options =
	| Partial<{
			onSuccess: (args: unknown) => void;
			onError: (args: unknown) => void;
			withBeforeLoad?: boolean;
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
