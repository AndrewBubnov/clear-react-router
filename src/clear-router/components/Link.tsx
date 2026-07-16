import { type ReactElement, type MouseEvent, type CSSProperties, useRef, useCallback, useEffect } from 'react';
import { useRuntime } from '../hooks/useRuntime';
import { useNavigate } from '../hooks/useNavigate';
import { routerConfig } from '../config/routerConfig';
import { RouterProps } from '../types/global';

type LinkProps = {
	to: string;
	children: ReactElement<{ onClick: (e: MouseEvent) => void; style: CSSProperties }>;
	prefetch?: RouterProps['prefetch'];
	hoverPrefetchDelay?: number;
};

export const Link = ({ children, to, prefetch: prefetchLink, hoverPrefetchDelay }: LinkProps) => {
	const { prefetch: configPrefetch, hoverPrefetchDelay: configPrefetchDelay } = routerConfig;
	const prefetch = prefetchLink || configPrefetch;
	const prefetchDelay = hoverPrefetchDelay ?? configPrefetchDelay;

	const { prefetchLoader } = useRuntime();
	const navigate = useNavigate();

	const timeout = useRef<number>(0);
	const ref = useRef<HTMLAnchorElement>(null);

	const onMouseEnter = useCallback(() => {
		if (prefetch !== 'hover' || !prefetchDelay) return;
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => prefetchLoader(to), prefetchDelay);
	}, [prefetch, prefetchDelay, prefetchLoader, to]);

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
			await prefetchLoader(to);
		})();
	}, [prefetch, prefetchLoader, to]);

	useEffect(() => {
		if (prefetch !== 'viewport') return;
		const element = ref.current;
		const observer = new IntersectionObserver(async () => {
			await prefetchLoader(to);
			observer.disconnect();
		});

		if (element) observer.observe(element);

		return () => {
			if (element) observer.disconnect();
		};
	}, [prefetch, prefetchLoader, to]);

	return (
		<a
			ref={ref}
			style={{ cursor: 'pointer' }}
			onClick={() => navigate(to)}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{children}
		</a>
	);
};
