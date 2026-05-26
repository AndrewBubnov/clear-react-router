import { useEffect, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import type { RouteItem } from './types.ts';

type RouterProps = {
	routes: RouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';

export const Router = ({ routes }: RouterProps) => {
	const { pathname } = window.location;

	const [route, setRoute] = useState<string>(pathname);

	useEffect(() => {
		const handler = (event: PopStateEvent) => {
			setRoute((event.target as Window).location.pathname);
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	const routeItem = routes.find(el => el.path === route)?.element || PAGE_NOT_FOUND;

	return <RouterProvider setRoute={setRoute}>{routeItem}</RouterProvider>;
};
