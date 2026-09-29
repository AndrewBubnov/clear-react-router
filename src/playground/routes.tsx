import { createRouter } from '../clear-router';
import { PlaygroundHome } from './PlaygroundHome';
import { ScrollPage } from './ScrollPage';
import { RetryPage, RetryErrorView } from './RetryPage';
import { LivePage } from './LivePage';
import { ActionsPage } from './ActionsPage';
import { BlockerPage } from './BlockerPage';
import { Loading } from './Loading';
import { addNote, fetchDoomed, fetchNotes, fetchQuotes, fetchUnstable } from './api';

export const playgroundRoutes = createRouter([
	{ path: '/', element: <PlaygroundHome /> },
	{ path: '/playground', element: <PlaygroundHome /> },
	{
		path: '/playground/scroll',
		element: <ScrollPage />,
		scrollRestoration: ['feed', 'gallery'],
		scrollRestorationBehavior: 'smooth',
	},
	{
		path: '/playground/retry',
		element: <RetryPage />,
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
		element: <LivePage />,
		loader: fetchQuotes,
		pollingInterval: 2000,
		loaderFallback: <Loading title="live quotes" />,
	},
	{
		path: '/playground/actions',
		element: <ActionsPage />,
		loader: fetchNotes,
		loaderFallback: <Loading title="notes" />,
		actions: () => ({
			addNote: async (data: Record<string, unknown>) => addNote(data['text'] as string),
		}),
	},
	{ path: '/playground/blocker', element: <BlockerPage /> },
]);
