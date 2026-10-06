import { Link, type LinkProps } from '../clear-router';
import type { AppPaths } from './AppPaths.gen';

export const AppLink = <T extends HTMLElement = HTMLAnchorElement>(props: LinkProps<T, AppPaths>) => (
	<Link {...props} />
);
