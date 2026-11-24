import { lazy, Suspense } from 'react';
import type { ElementProps, LinkProps } from '../clear-router';

export type NavLinkAs = 'link' | 'mui' | 'mantine';

type LinkAsRenderer = NonNullable<LinkProps['as']>;

const linkAs: LinkAsRenderer = (props: ElementProps<HTMLAnchorElement>) => <a {...props} />;

// Both library variants are lazy: the nav `as` demo must not put MUI or
// Mantine into the boot chunk — they load when the variant is first chosen.
// eslint-disable-next-line react-refresh/only-export-components
const MuiButton = lazy(() => import('./MuiNavButton'));
// eslint-disable-next-line react-refresh/only-export-components
const MantineButton = lazy(() => import('./MantineNavButton'));

const muiAs: LinkAsRenderer = (props, { isActive }) => (
	<Suspense fallback={<a {...props} />}>
		<MuiButton {...props} variant={isActive ? 'contained' : 'text'} size="small" />
	</Suspense>
);

const mantineAs: LinkAsRenderer = (props, { isActive }) => (
	<Suspense fallback={<a {...props} />}>
		<MantineButton {...props} variant={isActive ? 'gradient' : 'subtle'} size="compact-md" />
	</Suspense>
);

export const NAV_LINK_AS: Record<NavLinkAs, LinkAsRenderer> = {
	link: linkAs,
	mui: muiAs,
	mantine: mantineAs,
};
