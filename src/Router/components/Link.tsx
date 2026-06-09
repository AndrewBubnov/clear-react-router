import { type ReactElement, type MouseEvent, type CSSProperties } from 'react';
import { useNavigate } from '../hooks/useNavigate.ts';
import { useRouterActions } from '../hooks/useServiceContext.ts';

type LinkProps = {
	to: string;
	children: ReactElement<{ onClick: (e: MouseEvent) => void; style: CSSProperties }>;
	prefetch?: boolean;
};

export const Link = ({ children, to, prefetch = true }: LinkProps) => {
	const { prefetchLoader } = useRouterActions();
	const navigate = useNavigate();
	return (
		<a
			style={{ cursor: 'pointer' }}
			onClick={() => navigate({ pathname: to })}
			onMouseOver={() => prefetch && prefetchLoader(to)}
		>
			{children}
		</a>
	);
};
