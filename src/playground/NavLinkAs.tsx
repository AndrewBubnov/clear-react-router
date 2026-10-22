import MuiButton from '@mui/material/Button';
import { Button as MantineButton } from '@mantine/core';
import type { ElementProps, LinkProps } from '../clear-router';

export type NavLinkAs = 'link' | 'mui' | 'mantine';

type LinkAsRenderer = NonNullable<LinkProps['as']>;

const linkAs: LinkAsRenderer = (props: ElementProps<HTMLAnchorElement>) => <a {...props} />;

const muiAs: LinkAsRenderer = (props, { isActive }) => (
	<MuiButton {...props} variant={isActive ? 'contained' : 'text'} size="small" />
);

const mantineAs: LinkAsRenderer = (props, { isActive }) => (
	<MantineButton {...props} component="a" variant={isActive ? 'filled' : 'subtle'} size="compact-sm" />
);

export const NAV_LINK_AS: Record<NavLinkAs, LinkAsRenderer> = {
	link: linkAs,
	mui: muiAs,
	mantine: mantineAs,
};
