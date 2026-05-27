import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import type { Location, RouteItem } from './types.ts';
import { getParamsObject, removeNumbers, removeSlashes } from './utils.ts';

type RouterProps = {
	routeList: RouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';

export const Router = ({ routeList }: RouterProps) => {
	const [location, setLocation] = useState<Location>(window.location);

	useEffect(() => {
		const handler = (event: PopStateEvent) => setLocation((event.target as Window).location);
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	const routeItem = useMemo(
		() => routeList.find(el => removeSlashes(el.path) === removeSlashes(removeNumbers(location.pathname))),
		[location, routeList]
	);

	const params = useMemo(() => {
		if (!routeItem?.params) return {};
		const { pathname } = window.location;
		const split = pathname.split('/');
		return getParamsObject(routeItem.params, split);
	}, [routeItem]);

	return (
		<RouterProvider location={location} setLocation={setLocation} params={params}>
			{routeItem?.element || PAGE_NOT_FOUND}
		</RouterProvider>
	);
};
