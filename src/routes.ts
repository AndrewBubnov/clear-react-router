import { createRouter } from './clear-router';
import { Test } from './components/Test.tsx';
import { User } from './components/User.tsx';
import { NotFound } from './components/NotFound.tsx';
import { Fallback } from './components/Fallback.tsx';
import { ErrorComponent } from './components/ErrorComponent.tsx';
import { UserList } from './components/UserList.tsx';

export const routes = createRouter([
	{
		path: '/',
		element: () => import('./components/Home.tsx'),
		loader: () =>
			new Promise((resolve, _) => {
				console.log('fetching Home');
				return setTimeout(() => resolve(`hello, ${new Date().getSeconds()}`), 1500);
			}),
		loaderFallback: Fallback,
		errorElement: ErrorComponent,
		staleTime: 1000,
	},
	{
		path: '/about',
		element: () => import('./components/About.tsx'),
		loader: () =>
			new Promise((resolve, _) => {
				console.log('fetching About');
				return setTimeout(() => {
					resolve('about');
				}, 1000);
			}),
		staleTime: 10000,
		loaderFallback: Fallback,
		errorElement: ErrorComponent,
	},
	{ path: '/test', element: Test },
	{ path: '/user', element: UserList },
	{ path: '/user/:userId', element: User },
	{
		path: '/post/:postId',
		element: () => import('./components/Post.tsx'),
		loader: ({ params }) =>
			new Promise((resolve, _) => {
				console.log('fetching Post');
				return setTimeout(() => resolve(`Post, ${JSON.stringify(params)}`), 1500);
			}),
		afterLoad: ({ params }) => new Promise(() => console.log(`After load: params = ${JSON.stringify(params)}`)),
		children: [
			{
				path: '/comment/:commentId',
				element: () => import('./components/Comment.tsx'),
				beforeLoad: ({ context, redirect }) => {
					if (!context.isAuthorized) return redirect({ pathname: '/' });
				},
				loader: ({ params }) =>
					new Promise((resolve, _) => {
						console.log('fetching comment');
						return setTimeout(
							() => resolve(`Comment, ${params.commentId} for post ${params.postId}`),
							1500
						);
					}),
			},
		],
	},
	{ path: '*', element: NotFound },
]);
