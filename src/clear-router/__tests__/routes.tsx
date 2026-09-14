import { createRouter } from '../creators/createRouter.ts';
import { lazy } from '../utils/lazy';

const sleep = async (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const routes = createRouter([
	{
		path: '/',
		element: lazy(() => import('./components/Home.tsx')),
		loader: async () => {
			await sleep(1500);
			return `Hello from home, ${new Date().getSeconds()}`;
		},
	},
	{
		path: '/about',
		element: lazy(() => import('./components/About.tsx')),
		loader: async () => {
			await sleep(2000);
			return `About page: , ${new Date().getSeconds()}`;
		},
		staleTime: 1000,
		loaderFallback: <Fallback title="About" />,
	},
	{ path: '/test', element: Test },
]);
