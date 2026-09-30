import { createRouter } from '../clear-router';
import { PlaygroundHome } from './PlaygroundHome';
import { ScrollPage } from './ScrollPage';
import { RetryPage, RetryErrorView } from './RetryPage';
import { LivePage } from './LivePage';
import { ActionsPage } from './ActionsPage';
import { BlockerPage } from './BlockerPage';
import { Loading } from './Loading';
import { PlaygroundNotFound } from './NotFound';
import { PrefetchPage } from './PrefetchPage';
import { OptimisticPage } from './OptimisticPage';
import { CachePage, HeavyPage, ProductPage } from './CachePage';
import { SearchPage } from './SearchPage';
import { DashboardPage, LoginPage } from './LoginPage';
import {
	addNote,
	fetchDoomed,
	fetchHeavy,
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
		element: ScrollPage,
		scrollRestoration: ['feed', 'gallery'],
		scrollRestorationBehavior: 'smooth',
	},
	{
		path: '/playground/retry',
		element: RetryPage,
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
		errorElement: <RetryErrorView />,
	},
	{
		path: '/playground/live',
		element: LivePage,
		loader: fetchQuotes,
		pollingInterval: 2000,
		loaderFallback: <Loading title="live quotes" />,
	},
	{
		path: '/playground/actions',
		element: ActionsPage,
		loader: fetchNotes,
		loaderFallback: <Loading title="notes" />,
		actions: () => ({
			addNote: async (data: Record<string, unknown>) => addNote(data['text'] as string),
		}),
	},
	{
		path: '/playground/prefetch',
		element: <PrefetchPage />,
		loader: fetchSlow,
		loaderFallback: <Loading title="slow payload" />,
	},
	{
		path: '/playground/optimistic',
		element: <OptimisticPage />,
		loader: fetchOptimisticValue,
		staleTime: 800,
		optimistic: true,
		loaderFallback: <Loading title="optimistic value" />,
	},
	{ path: '/playground/cache', element: <CachePage /> },
	{
		path: '/playground/product/:productId',
		element: <ProductPage />,
		loader: ({ params }) => fetchProduct(params.productId),
		loaderFallback: <Loading title="product" />,
	},
	{
		path: '/playground/heavy',
		element: <HeavyPage />,
		loader: fetchHeavy,
		gcTime: 8000,
		loaderFallback: <Loading title="heavy payload" />,
	},
	{
		path: '/playground/search',
		element: <SearchPage />,
	},
	{
		path: '/playground/login',
		element: <LoginPage />,
	},
	{
		path: '/playground/dashboard',
		element: <DashboardPage />,
		beforeLoad: ({ context, redirect }) => {
			if ((context as { isAuthorized?: boolean }).isAuthorized !== true)
				return redirect({ pathname: '/playground/login', state: { from: '/playground/dashboard' } });
		},
	},
	{ path: '/playground/blocker', element: <BlockerPage /> },
	{ path: '*', element: <PlaygroundNotFound /> },
]);
