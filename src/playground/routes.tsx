import { createRouter, lazy } from '../clear-router';
import { PlaygroundHome } from './PlaygroundHome';
import { DeferredSkeleton, PageSkeleton, ProductSkeleton } from './Skeletons';
import { NestLayout } from './NestLayout';
import { NestChildLayout } from './NestChildLayout';
import {
	HEAVY_GC_TIME,
	addNote,
	fetchCachePayload,
	fetchDeferredDashboard,
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
		staleTime: 10000,
		loaderFallback: <PageSkeleton />,
		errorElement: lazy(() => import('./RetryErrorPage')),
	},
	{
		path: '/playground/retry-raw',
		element: <div>Unreachable — this loader always fails</div>,
		loader: fetchDoomed,
		retry: 0,
		loaderFallback: <PageSkeleton />,
		errorElement: lazy(() => import('./RetryErrorView')),
	},
	{
		path: '/playground/live',
		element: lazy(() => import('./LivePage')),
		loader: fetchQuotes,
		pollingInterval: 2000,
		loaderFallback: <PageSkeleton />,
	},
	{
		path: '/playground/actions',
		element: lazy(() => import('./ActionsPage')),
		loader: fetchNotes,
		loaderFallback: <PageSkeleton />,
		actions: () => ({
			addNote: async (data: Record<string, unknown>) => addNote(data['text'] as string),
		}),
	},
	{
		path: '/playground/prefetch',
		element: lazy(() => import('./PrefetchPage')),
		loader: fetchSlow,
		loaderFallback: <PageSkeleton />,
	},
	{
		path: '/playground/optimistic',
		element: lazy(() => import('./OptimisticPage')),
		loader: fetchOptimisticValue,
		staleTime: 800,
		optimistic: true,
		loaderFallback: <PageSkeleton />,
	},
	{
		path: '/playground/deferred',
		element: lazy(() => import('./DeferredPage')),
		loader: fetchDeferredDashboard,
		staleTime: 10000,
		loaderFallback: <DeferredSkeleton />,
	},
	{
		path: '/playground/nest',
		element: lazy(() => import('./NestPage')),
		layout: NestLayout,
		children: [
			{
				path: '/:nestId',
				element: lazy(() => import('./NestChildPage')),
				layout: NestChildLayout,
				loader: ({ params }) => fetchNest(params.nestId),
				staleTime: Infinity,
				loaderFallback: <ProductSkeleton />,
				children: [
					{
						path: '/item/:itemId',
						element: lazy(() => import('./NestItemPage')),
						loader: ({ params }) => fetchNestItem(params.nestId, params.itemId),
						staleTime: Infinity,
						loaderFallback: <ProductSkeleton />,
					},
				],
			},
		],
	},
	{
		path: '/playground/cache',
		element: lazy(() => import('./CachePage')),
		loader: fetchCachePayload,
		loaderFallback: <PageSkeleton />,
		children: [
			{
				path: '/product/:productId',
				element: lazy(() => import('./ProductPage')),
				loader: ({ params }) => fetchProduct(params.productId),
				loaderFallback: <ProductSkeleton />,
			},
			{
				path: '/heavy',
				element: lazy(() => import('./HeavyPage')),
				loader: fetchHeavy,
				staleTime: Infinity,
				gcTime: HEAVY_GC_TIME,
				loaderFallback: <PageSkeleton />,
			},
		],
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
