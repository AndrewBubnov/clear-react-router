import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import type { RouteItem } from './types.ts';
import { getParamsObject } from './utils.ts';

type RouterProps = {
	routeList: RouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';

export const Router = ({ routeList }: RouterProps) => {
	const { pathname } = window.location;

	const [route, setRoute] = useState<string>(pathname);

	useEffect(() => {
		const handler = (event: PopStateEvent) => setRoute((event.target as Window).location.pathname);
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	const routeItem = useMemo(
		() =>
			routeList.find(el => {
				const isRoot = el.path === '/';
				return (route === el.path && isRoot) || (!isRoot && route.startsWith(el.path));
			}),
		[route, routeList]
	);

	const params = useMemo(() => {
		if (!routeItem?.params) return {};
		const { pathname } = window.location;
		const split = pathname.split('/');
		return getParamsObject(routeItem.params, split);
	}, [routeItem]);

	return (
		<RouterProvider setRoute={setRoute} params={params}>
			{routeItem?.element || PAGE_NOT_FOUND}
		</RouterProvider>
	);
};
