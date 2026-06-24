import { type ReactElement, type MouseEvent, type CSSProperties, useRef, useCallback } from 'react';
import { useNavigate } from '../hooks/useNavigate';
import { useRouterActions } from '../hooks/useServiceContext';

type LinkProps = {
	to: string;
	children: ReactElement<{ onClick: (e: MouseEvent) => void; style: CSSProperties }>;
	prefetch?: boolean;
	prefetchDelay?: number;
};

const STANDARD_DELAY = 150;

export const Link = ({ children, to, prefetch = true, prefetchDelay = STANDARD_DELAY }: LinkProps) => {
	const { prefetchLoader } = useRouterActions();
	const navigate = useNavigate();
	const timeout = useRef<number>(0);

	const onMouseEnter = useCallback(() => {
		if (!prefetch || !prefetchDelay) return;
		if (timeout.current) clearTimeout(timeout.current);
		timeout.current = window.setTimeout(() => prefetchLoader(to), prefetchDelay);
	}, [prefetch, prefetchDelay, prefetchLoader, to]);

	const onMouseLeave = useCallback(() => {
		if (!prefetch || !prefetchDelay) return;
		if (timeout.current) clearTimeout(timeout.current);
	}, [prefetch, prefetchDelay]);

	return (
		<a
			style={{ cursor: 'pointer' }}
			onClick={() => navigate(to)}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
		>
			{children}
		</a>
	);
};
