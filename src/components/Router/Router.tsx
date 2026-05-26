import { type ReactElement, useEffect, useState } from 'react';
import { RouterProvider } from './provider/RouterProvider.tsx';

type RouterProps = {
	routes: Record<string, ReactElement>;
};

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

	return <RouterProvider setRoute={setRoute}>{routes[route] || null}</RouterProvider>;
};
