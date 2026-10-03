import { createRouter, lazy } from '../clear-router';
import { PlaygroundHome } from './PlaygroundHome';
import { Loading } from './Loading';
import {
	addNote,
	fetchCachePayload,
	fetchDoomed,
	fetchHeavy,
	fetchNest,
	fetchNestItem,
	fetchNotes,
	fetchOptimisticValue,
	fetchProduct,
	fetchQuotes,
	fetchSlow,
	fetchUnstable,
} from './api';

export const playgroundRoutes = createRouter([
	{ path: '/', element: PlaygroundHome },
	{ path: '/playground', element: PlaygroundHome },
	{
		path: '/playground/scroll',
		element: lazy(() => import('./ScrollPage')),
		scrollRestoration: ['feed', 'gallery'],
		scrollRestorationBehavior: 'smooth',
		optimistic: true,
	},
	{
		path: '/playground/retry',
		element: lazy(() => import('./RetryPage')),
		loader: fetchUnstable,
		retry: { count: 3, delay: 400 },
		loaderFallback: <Loading title="retry demo" />,
	},
	{
		path: '/playground/retry-raw',
		element: <div>Unreachable — this loader always fails</div>,
		loader: fetchDoomed,
		retry: 0,
		loaderFallback: <Loading title="doomed demo" />,
		errorElement: lazy(() => import('./RetryErrorView')),
	},
	{
		path: '/playground/live',
		element: lazy(() => import('./LivePage')),
		loader: fetchQuotes,
		pollingInterval: 2000,
		loaderFallback: <Loading title="live quotes" />,
	},
	{
		path: '/playground/actions',
		element: lazy(() => import('./ActionsPage')),
		loader: fetchNotes,
		loaderFallback: <Loading title="notes" />,
		actions: () => ({
			addNote: async (data: Record<string, unknown>) => addNote(data['text'] as string),
		}),
	},
	{
		path: '/playground/prefetch',
		element: lazy(() => import('./PrefetchPage')),
		loader: fetchSlow,
		loaderFallback: <Loading title="slow payload" />,
	},
	{
		path: '/playground/optimistic',
		element: lazy(() => import('./OptimisticPage')),
		loader: fetchOptimisticValue,
		staleTime: 800,
		optimistic: true,
		loaderFallback: <Loading title="optimistic value" />,
	},
	{
		path: '/playground/nest',
		element: lazy(() => import('./NestPage')),
		children: [
			{
				path: '/:nestId',
				element: lazy(() => import('./NestChildPage')),
				loader: ({ params }) => fetchNest(params.nestId),
				loaderFallback: <Loading title="nest" />,
				children: [
					{
						path: '/item/:itemId',
						element: lazy(() => import('./NestItemPage')),
						loader: ({ params }) => fetchNestItem(params.nestId, params.itemId),
						loaderFallback: <Loading title="nest item" />,
					},
				],
			},
		],
	},
	{
		path: '/playground/cache',
		element: lazy(() => import('./CachePage')),
		loader: fetchCachePayload,
		loaderFallback: <Loading title="cache lab" />,
	},
	{
		path: '/playground/product/:productId',
		element: lazy(() => import('./ProductPage')),
		loader: ({ params }) => fetchProduct(params.productId),
		loaderFallback: <Loading title="product" />,
	},
	{
		path: '/playground/heavy',
		element: lazy(() => import('./HeavyPage')),
		loader: fetchHeavy,
		gcTime: 5000,
		loaderFallback: <Loading title="heavy payload" />,
	},
	{
		path: '/playground/search',
		element: lazy(() => import('./SearchPage')),
	},
	{
		path: '/playground/guard',
		element: lazy(() => import('./GuardPage')),
	},
	{
		path: '/playground/dashboard',
		element: lazy(() => import('./DashboardPage')),
		beforeLoad: ({ context, redirect }) => {
			if (!context.isAuthorized)
				return redirect({ pathname: '/playground/guard', state: { from: '/playground/dashboard' } });
		},
	},
	{ path: '/playground/blocker', element: lazy(() => import('./BlockerPage')) },
	{ path: '/playground/settings', element: lazy(() => import('./SettingsPage')) },
	{ path: '*', element: lazy(() => import('./NotFound')) },
]);
