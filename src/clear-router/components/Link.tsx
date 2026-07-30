import {
	type CSSProperties,
	useRef,
	useCallback,
	useEffect,
	ReactNode,
	MouseEvent,
	ComponentPropsWithoutRef,
} from 'react';
import { router } from '../instance';
import { useIsRoutePending } from '../hooks/useIsRoutePending';
import { useNavigate } from '../hooks/useNavigate';
import { useLocation } from '../hooks/useLocation';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types';

type LinkProps = Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'className' | 'style'> & {
	to: string;
	children: ReactNode;
	prefetch?: RouterProps['prefetch'];
	hoverPrefetchDelay?: number;
	style?: CSSProperties | (({ isActive }: { isActive: boolean; isPending: boolean }) => CSSProperties);
	className?: string | (({ isActive }: { isActive: boolean; isPending: boolean }) => string);
	activeClassName?: string;
	pendingClassName?: string;
	onClick?(): void;
};

export const Link = ({
	children,
	to,
	prefetch: prefetchLink,
	hoverPrefetchDelay,
	className,
	style,
	onClick,
	activeClassName = 'active-link',
	pendingClassName = 'pending-link',
}: LinkProps) => {
	const isPending = useIsRoutePending(to);
	const { pathname } = useLocation();
	const navigate = useNavigate();

	const timeout = useRef<number>(0);
	const ref = useRef<HTMLAnchorElement>(null);

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
		const element = ref.current;
		const observer = new IntersectionObserver(async () => {
			await router.runtime.prefetch(to);
			observer.disconnect();
		});

		if (element) observer.observe(element);

		return () => {
			if (element) observer.disconnect();
		};
	}, [prefetch, to]);

	const isActive = to === pathname;
	const normalizedClassName = typeof className === 'function' ? className({ isActive, isPending }) : className;
	const normalizedStyle = typeof style === 'function' ? style({ isActive, isPending }) : style;
	const resultClassName = [isActive && activeClassName, isPending && pendingClassName, normalizedClassName]
		.filter(Boolean)
		.join(' ');

	const clickHandler = async (event: MouseEvent) => {
		event.preventDefault();
		onClick?.();
		await navigate(to);
	};

	return (
		<a
			href={to}
			ref={ref}
			style={normalizedStyle}
			className={resultClassName}
			onClick={clickHandler}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{children}
		</a>
	);
};
