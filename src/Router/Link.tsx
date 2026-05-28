import { type ReactElement, type MouseEvent, type CSSProperties } from 'react';
import { useNavigate } from './hooks/useNavigate.ts';
import { useRouterContext } from './hooks/useRouterContext.ts';

type LinkProps = {
	to: string;
	children: ReactElement<{ onClick: (e: MouseEvent) => void; style: CSSProperties }>;
	prefetch?: boolean;
};

export const Link = ({ children, to, prefetch = true }: LinkProps) => {
	const { prefetchLoader } = useRouterContext();
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
