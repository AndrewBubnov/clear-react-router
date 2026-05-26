import { Home } from './components/Home.tsx';
import { About } from './components/About.tsx';
import { Test } from './components/Test.tsx';
import { Post } from './components/Post.tsx';
import { Comment } from './components/Comment.tsx';
import { createRouter } from './Router/utils.ts';

export const routeList = createRouter([
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
	{ path: '/test', element: <Test /> },
	{ path: '/user/:userId', element: <Test /> },
	{ path: '/post/:postId', element: <Post />, children: [{ path: '/comment/:commentId', element: <Comment /> }] },
]);
