import type { ReactElement } from 'react';
import { Home } from './components/Home.tsx';
import { About } from './components/About.tsx';
import { Test } from './components/Test.tsx';

export const router: Record<string, ReactElement> = {
	'/': <Home />,
	'/about': <About />,
	'/test': <Test />,
};
