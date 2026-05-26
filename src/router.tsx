import { Home } from './components/Home.tsx';
import { About } from './components/About.tsx';
import { Test } from './components/Test.tsx';
import { createRouter } from './components/Router/utils.ts';

export const router = createRouter([
	{ path: '/', element: <Home /> },
	{ path: '/about', element: <About /> },
	{ path: '/test', element: <Test /> },
]);
