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
import { useIsRoutePending } from '../hooks/useIsRoutePending';
import { useNavigate } from '../hooks/useNavigate';
import { useLocation } from '../hooks/useLocation';
import { routerConfig } from '../config/routerConfig';
import { ElementProps, RouterProps, Location } from '../types';

type ElementState = { isActive: boolean; isPending: boolean };

type LinkProps<T extends HTMLElement = HTMLAnchorElement> = {
	to: string;
	search?: string;
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
};

const defaultAs = (props: ElementProps<HTMLAnchorElement>) => <a {...props} />;

export const Link = <T extends HTMLElement = HTMLAnchorElement>({
	children,
	to,
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
}: LinkProps<T>) => {
	const isPending = useIsRoutePending(to);
	const { pathname } = useLocation();
	const navigate = useNavigate();

	const timeout = useRef<number>(0);
	const elementRef = useRef<HTMLElement | null>(null);

	const { defaultPrefetch: configPrefetch, defaultHoverPrefetchDelay: configPrefetchDelay } = routerConfig;
	const prefetch = linkPrefetch || configPrefetch;

	const prefetchDelay = hoverPrefetchDelay ?? configPrefetchDelay;

	const location: Location = useMemo(() => ({ pathname: to, search, state }), [search, state, to]);

	const onMouseEnter = useCallback(() => {
		if (prefetch !== 'hover' || !prefetchDelay) return;
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => router.runtime.prefetch(location), prefetchDelay);
	}, [prefetch, prefetchDelay, location]);

	const onMouseLeave = useCallback(() => {
		if (prefetch !== 'hover' || !prefetchDelay) return;
		if (timeout.current) {
			clearTimeout(timeout.current);
			timeout.current = 0;
		}
	}, [prefetch, prefetchDelay]);

	useEffect(() => {
		if (prefetch !== 'render') return;
		(async () => {
			await router.runtime.prefetch(location);
		})();
	}, [prefetch, location]);

	useEffect(() => {
		if (prefetch !== 'viewport') return;
		const element = elementRef.current;
		if (!element) return;
		const observer = new IntersectionObserver(async ([entry]) => {
			if (!entry.isIntersecting) return;
			await router.runtime.prefetch(location);
			observer.disconnect();
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [prefetch, location]);

	useEffect(
		() => () => {
			if (timeout.current) clearTimeout(timeout.current);
		},
		[]
	);
	const isActive =
		to === '/' ? pathname === '/' : exact ? pathname === to : pathname === to || pathname?.startsWith(`${to}/`);
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

	return as(
		// eslint-disable-next-line react-hooks/refs
		{
			ref: elementRef as Ref<T>,
			href: to,
			style: normalizedStyle,
			className: resultClassName,
			onClick: clickHandler,
			onMouseEnter,
			onMouseLeave,
			children,
		},
		{ isActive, isPending }
	);
};
