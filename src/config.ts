import { Home } from './components/Home.tsx';
import { About } from './components/About.tsx';
import { Test } from './components/Test.tsx';
import { Post } from './components/Post.tsx';
import { Comment } from './components/Comment.tsx';
import { User } from './components/User.tsx';
import { NotFound } from './components/NotFound.tsx';
import { Fallback } from './components/Fallback.tsx';
import { ErrorComponent } from './components/ErrorComponent.tsx';
import { createRouter } from './Router/utils/utils.ts';
import { redirect } from './Router/utils/redirect.ts';

export const routeList = createRouter([
	{
		path: '/',
		element: Home,
		loader: () =>
			new Promise((resolve, _) =>
				setTimeout(() => {
					console.log('fetched');
					resolve('hello');
				}, 1000)
			),
		fallback: Fallback,
		errorElement: ErrorComponent,
		staleTime: 10000,
	},
	{ path: '/about', element: About },
	{ path: '/test', element: Test },
	{ path: '/user/:userId', element: User },
	{
		path: '/post/:postId',
		element: Post,
		children: [
			{
				path: '/comment/:commentId',
				element: Comment,
				beforeLoad: context => {
					if (!context.isAuthorized) return redirect('/');
				},
			},
		],
	},
	{ path: '*', element: NotFound },
]);
