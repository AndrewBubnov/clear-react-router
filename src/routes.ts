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
			new Promise((_, reject) => {
				console.log('fetching About');
				return setTimeout(() => {
					reject('about');
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
		children: [
			{
				path: '/comment/:commentId',
				element: () => import('./components/Comment.tsx'),
				beforeLoad: ({ context, redirect }) => {
					if (!context.isAuthorized) return redirect({ pathname: '/' });
				},
			},
		],
	},
	{ path: '*', element: NotFound },
]);
