import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import type { ClientRouteItem } from './types.ts';

type RouterProps = {
	routeList: ClientRouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';

export const Router = ({ routeList }: RouterProps) => {
	const { pathname } = window.location;

	const [route, setRoute] = useState<string>(pathname);

	useEffect(() => {
		const handler = (event: PopStateEvent) => {
			setRoute((event.target as Window).location.pathname);
		};
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	const routeItem = useMemo(
		() => routeList.find(el => el.path === route)?.element || PAGE_NOT_FOUND,
		[route, routeList]
	);

	return <RouterProvider setRoute={setRoute}>{routeItem}</RouterProvider>;
};
