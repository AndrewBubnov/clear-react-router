import { type CSSProperties, useRef, useCallback, useEffect, ReactNode } from 'react';
import { router } from '../instance';
import { useNavigate } from '../hooks/useNavigate';
import { useLocation } from '../hooks/useLocation';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types';

type LinkProps = {
	to: string;
	children: ReactNode;
	prefetch?: RouterProps['prefetch'];
	hoverPrefetchDelay?: number;
	style?: CSSProperties | (({ isActive }: { isActive: boolean; isPending: boolean }) => CSSProperties);
	className?: string | (({ isActive }: { isActive: boolean; isPending: boolean }) => string);
	activeClassName?: string;
	pendingClassName?: string;
};

export const Link = ({
	children,
	to,
	prefetch: prefetchLink,
	hoverPrefetchDelay,
	className,
	style,
	activeClassName = 'active-link',
	pendingClassName = 'pending-link',
}: LinkProps) => {
	const { useIsLoading } = router.hooks;
	const [isPending] = useIsLoading();
	const { pathname } = useLocation();
	const { prefetch: configPrefetch, hoverPrefetchDelay: configPrefetchDelay } = routerConfig;

	const prefetch = prefetchLink || configPrefetch;
	const prefetchDelay = hoverPrefetchDelay ?? configPrefetchDelay;

	const navigate = useNavigate();

	const timeout = useRef<number>(0);
	const ref = useRef<HTMLAnchorElement>(null);

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

	const normalizedClassName = typeof className === 'function' ? className({ isActive, isPending }) : `${className}`;

	const normalizedStyle = typeof style === 'function' ? style({ isActive, isPending }) : style;

	return (
		<a
			ref={ref}
			style={normalizedStyle}
			className={`${isActive ? activeClassName : isPending ? pendingClassName : ''} ${normalizedClassName}`}
			onClick={() => navigate(to)}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{children}
		</a>
	);
};
