import { cloneElement, type ReactElement, type MouseEvent, type CSSProperties } from 'react';
import { useRouterContext } from './hooks/useRouterContext.ts';

type LinkProps = {
	to: string;
	children: ReactElement<{ onClick: (e: MouseEvent) => void; style: CSSProperties }>;
};

export const Link = ({ children, to }: LinkProps) => {
	const { setLocation } = useRouterContext('Link component');
	return cloneElement(children, {
		onClick: e => {
			children.props?.onClick?.(e);
			setLocation({ pathname: to });
			history.pushState(null, '', to);
		},
		style: { cursor: 'pointer' },
	});
};
