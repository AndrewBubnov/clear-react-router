import { createRouter, redirect } from './clear-router';
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
			new Promise((resolve, _) =>
				setTimeout(() => {
					console.log('fetched');
					resolve('hello');
				}, 3000)
			),
		loaderFallback: Fallback,
		errorElement: ErrorComponent,
		staleTime: 1000,
	},
	{ path: '/about', element: () => import('./components/About.tsx') },
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
				beforeLoad: context => {
					if (!context.isAuthorized) return redirect('/');
				},
			},
		],
	},
	{ path: '*', element: NotFound },
]);
