import { useEffect, useMemo, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';
import type { RouteItem } from './types.ts';
import { getParamsObject, removeNumbers, removeSlashes } from './utils.ts';

type RouterProps = {
	routeList: RouteItem[];
};

const PAGE_NOT_FOUND = 'error 404. Page not found';

export const Router = ({ routeList }: RouterProps) => {
	const { pathname } = window.location;

	const [route, setRoute] = useState<string>(pathname);
	const [navigationState, updateNavigationState] = useState<unknown>(undefined);

	useEffect(() => {
		const handler = (event: PopStateEvent) => setRoute((event.target as Window).location.pathname);
		window.addEventListener('popstate', handler);
		return () => window.removeEventListener('popstate', handler);
	}, []);

	const routeItem = useMemo(
		() => routeList.find(el => removeSlashes(el.path) === removeSlashes(removeNumbers(route))),
		[route, routeList]
	);

	const params = useMemo(() => {
		if (!routeItem?.params) return {};
		const { pathname } = window.location;
		const split = pathname.split('/');
		return getParamsObject(routeItem.params, split);
	}, [routeItem]);

	return (
		<RouterProvider
			setRoute={setRoute}
			params={params}
			navigationState={navigationState}
			updateNavigationState={updateNavigationState}
		>
			{routeItem?.element || PAGE_NOT_FOUND}
		</RouterProvider>
	);
};
