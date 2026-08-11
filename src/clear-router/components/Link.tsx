import { type CSSProperties, useRef, useCallback, useEffect, ReactNode, MouseEvent, ReactElement, Ref } from 'react';
import { router } from '../instance';
import { useIsRoutePending } from '../hooks/useIsRoutePending';
import { useNavigate } from '../hooks/useNavigate';
import { useLocation } from '../hooks/useLocation';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types';

type States = { isActive: boolean; isPending: boolean };

type ElementProps<T extends HTMLElement = HTMLElement> = {
	ref: Ref<T>;
	href: string;
	isActive: boolean;
	isPending: boolean;
	onClick(event: MouseEvent): void;
	onMouseEnter(event: MouseEvent): void;
	onMouseLeave(event: MouseEvent): void;
	className?: string;
	style?: CSSProperties;
	children?: ReactNode;
};

type LinkProps<T extends HTMLElement = HTMLAnchorElement> = {
	to: string;
	children?: ReactNode;
	as?: (props: ElementProps<T>) => ReactElement;
	prefetch?: RouterProps['prefetch'];
	hoverPrefetchDelay?: number;
	className?: string | ((arg: States) => string);
	activeClassName?: string;
	pendingClassName?: string;
	beforeNavigate?(): Promise<void>;
	style?: CSSProperties | ((arg: States) => CSSProperties);
	exact?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const defaultAs = ({ isActive, isPending, ...props }: ElementProps<HTMLAnchorElement>) => <a {...props} />;

export const Link = <T extends HTMLElement = HTMLAnchorElement>({
	children,
	to,
	as = defaultAs as unknown as (props: ElementProps<T>) => ReactElement,
	prefetch: prefetchLink,
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

	const { prefetch: configPrefetch, hoverPrefetchDelay: configPrefetchDelay } = routerConfig;
	const prefetch = prefetchLink || configPrefetch;
	const prefetchDelay = hoverPrefetchDelay ?? configPrefetchDelay;

	const onMouseEnter = useCallback(() => {
		if (prefetch !== 'hover' || !prefetchDelay) return;
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => router.runtime.prefetch(to), prefetchDelay);
	}, [prefetch, prefetchDelay, to]);

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
			await router.runtime.prefetch(to);
		})();
	}, [prefetch, to]);

	useEffect(() => {
		if (prefetch !== 'viewport') return;
		const element = elementRef.current;
		if (!element) return;
		const observer = new IntersectionObserver(async () => {
			await router.runtime.prefetch(to);
			observer.disconnect();
		});
		observer.observe(element);
		return () => observer.disconnect();
	}, [prefetch, to]);

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
		await navigate(to);
	};

	// eslint-disable-next-line react-hooks/refs
	return as({
		ref: elementRef as Ref<T>,
		href: to,
		style: normalizedStyle,
		className: resultClassName,
		onClick: clickHandler,
		onMouseEnter,
		onMouseLeave,
		isActive,
		isPending,
		children,
	});
};
