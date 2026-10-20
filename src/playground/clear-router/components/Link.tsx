import {
	type CSSProperties,
	useRef,
	useCallback,
	useEffect,
	ReactNode,
	MouseEvent,
	ReactElement,
	Ref,
	useMemo,
} from 'react';
import { router } from '../instance';
import { useNavigate } from '../hooks/useNavigate';
import { routerConfig } from '../config/routerConfig';
import { formatSearchObject, interpolatePath } from '../utils/utils';
import { LinkDestination, RouterProps, Location, SearchObject } from '../types';

type ElementState = { isActive: boolean; isPending: boolean };

export type ElementProps<T extends HTMLElement = HTMLElement> = {
	'ref': Ref<T>;
	'href': string;
	'className'?: string;
	'style'?: CSSProperties;
	onClick(event: MouseEvent): void;
	onMouseEnter(event: MouseEvent): void;
	onMouseLeave(event: MouseEvent): void;
	'children'?: ReactNode;
	'aria-current'?: 'page';
	'aria-busy'?: boolean;
} & Record<`data-${string}` | `aria-${string}`, unknown>;

export type LinkProps<T extends HTMLElement = HTMLAnchorElement, TPath extends string = string> = {
	search?: string | SearchObject;
	state?: unknown;
	children?: ReactNode;
	as?: (props: ElementProps<T>, state: ElementState) => ReactElement;
	prefetch?: RouterProps['defaultPrefetch'];
	hoverPrefetchDelay?: number;
	className?: string | ((arg: ElementState) => string);
	activeClassName?: string;
	pendingClassName?: string;
	beforeNavigate?(): Promise<void>;
	style?: CSSProperties | ((arg: ElementState) => CSSProperties);
	exact?: boolean;
} & LinkDestination<TPath> &
	Record<`data-${string}` | `aria-${string}`, unknown>;

const defaultAs = (props: ElementProps<HTMLAnchorElement>) => <a {...props} />;
const comparator = (to: string, pathname: string, exact: boolean) =>
	to === '/' ? pathname === '/' : exact ? pathname === to : pathname === to || pathname?.startsWith(`${to}/`);

export const Link = <T extends HTMLElement = HTMLAnchorElement, const TPath extends string = string>({
	children,
	to,
	path,
	params,
	search = '',
	state,
	as = defaultAs as unknown as (props: ElementProps<T>) => ReactElement,
	prefetch: linkPrefetch,
	hoverPrefetchDelay,
	className,
	style,
	beforeNavigate,
	exact = false,
	activeClassName = 'active-link',
	pendingClassName = 'pending-link',
	...rest
}: LinkProps<T, TPath>) => {
	const pathname = path !== undefined ? interpolatePath(path, params ?? {}) : (to ?? '');
	const { useRouteDataSelector } = router.hooks;
	const isPending = useRouteDataSelector(
		({ location: { pathname: currentPathname }, status }) => currentPathname === pathname && status === 'pending'
	);
	const navigate = useNavigate();
	const isActive = useRouteDataSelector(({ location: { pathname: currentPathname } }) =>
		comparator(pathname, currentPathname, exact)
	);

	const timeout = useRef<number>(0);
	const elementRef = useRef<HTMLElement | null>(null);

	const getPrefetchStrategy = useCallback(() => linkPrefetch || routerConfig.defaultPrefetch, [linkPrefetch]);
	const getPrefetchDelay = useCallback(
		() => hoverPrefetchDelay ?? routerConfig.defaultHoverPrefetchDelay,
		[hoverPrefetchDelay]
	);

	const searchString = typeof search === 'object' ? formatSearchObject(search) : search;

	const location: Omit<Location, 'search'> & { search: string } = useMemo(
		() => ({ pathname, search: searchString, state }),
		[searchString, state, pathname]
	);

	const onMouseEnter = useCallback(() => {
		const prefetchDelay = getPrefetchDelay();
		if (getPrefetchStrategy() !== 'hover' || !prefetchDelay) return;
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => router.runtime.prefetch(location), prefetchDelay);
	}, [getPrefetchStrategy, getPrefetchDelay, location]);

	const onMouseLeave = useCallback(() => {
		if (getPrefetchStrategy() !== 'hover' || !getPrefetchDelay()) return;
		if (timeout.current) {
			clearTimeout(timeout.current);
			timeout.current = 0;
		}
	}, [getPrefetchStrategy, getPrefetchDelay]);

	useEffect(() => {
		if (getPrefetchStrategy() !== 'render') return;
		(async () => {
			await router.runtime.prefetch(location);
		})();
	}, [getPrefetchStrategy, location]);

	useEffect(() => {
		if (getPrefetchStrategy() !== 'viewport') return;
		const element = elementRef.current;
		if (!element) return;
		const observer = new IntersectionObserver(async ([entry]) => {
			if (!entry.isIntersecting) return;
			await router.runtime.prefetch(location);
			observer.disconnect();
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [getPrefetchStrategy, location]);

	useEffect(
		() => () => {
			if (timeout.current) clearTimeout(timeout.current);
		},
		[]
	);
	const normalizedClassName = typeof className === 'function' ? className({ isActive, isPending }) : className;
	const normalizedStyle = typeof style === 'function' ? style({ isActive, isPending }) : style;
	const resultClassName = [isActive && activeClassName, isPending && pendingClassName, normalizedClassName]
		.filter(Boolean)
		.join(' ');

	const clickHandler = async (event: MouseEvent) => {
		if (
			event.defaultPrevented ||
			event.button !== 0 ||
			event.metaKey ||
			event.ctrlKey ||
			event.shiftKey ||
			event.altKey
		) {
			return;
		}
		event.preventDefault();
		await beforeNavigate?.();
		await navigate(location);
	};

	const href = `${pathname}${searchString}`;

	return as(
		// eslint-disable-next-line react-hooks/refs
		{
			'ref': elementRef as Ref<T>,
			'style': normalizedStyle,
			'className': resultClassName,
			'onClick': clickHandler,
			href,
			onMouseEnter,
			onMouseLeave,
			children,
			...rest,
			'aria-current': isActive ? 'page' : undefined,
			'aria-busy': isPending || undefined,
		},
		{ isActive, isPending }
	);
};
