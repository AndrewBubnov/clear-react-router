import { lazy, Suspense } from 'react';
import { Button as MantineButton } from '@mantine/core';
import type { ElementProps, LinkProps } from '../clear-router';

export type NavLinkAs = 'link' | 'mui' | 'mantine';

type LinkAsRenderer = NonNullable<LinkProps['as']>;

const linkAs: LinkAsRenderer = (props: ElementProps<HTMLAnchorElement>) => <a {...props} />;

const MuiButton = lazy(() => import('./MuiNavButton'));

const muiAs: LinkAsRenderer = (props, { isActive }) => (
	<Suspense fallback={<a {...props} />}>
		<MuiButton {...props} variant={isActive ? 'contained' : 'text'} size="small" />
	</Suspense>
);

const mantineAs: LinkAsRenderer = (props, { isActive }) => (
	<MantineButton
		{...props}
		component="a"
		variant={isActive ? 'gradient' : 'subtle'}
		size="compact-md"
		gradient={{ from: 'teal', to: 'blue', deg: 60 }}
	/>
);

export const NAV_LINK_AS: Record<NavLinkAs, LinkAsRenderer> = {
	link: linkAs,
	mui: muiAs,
	mantine: mantineAs,
};
