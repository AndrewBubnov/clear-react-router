import { cloneElement, type ReactElement, type MouseEvent, type CSSProperties } from 'react';
import { useRouterProvider } from './hooks/useRouterProvider.ts';

type LinkProps = {
	to: string;
	children: ReactElement<{ onClick: (e: MouseEvent) => void; style: CSSProperties }>;
};

export const Link = ({ children, to }: LinkProps) => {
	const { setRoute } = useRouterProvider();
	return cloneElement(children, {
		onClick: e => {
			children.props?.onClick?.(e);
			setRoute(to);
			history.pushState(null, '', to);
		},
		style: { cursor: 'pointer' },
	});
};
