import { Router } from './clear-router';
import { routes } from './routes.ts';
import { RouterProvider } from './clear-router/components/RouterProvider.tsx';
import { Navbar } from './components/Navbar.tsx';

function App() {
	return (
		<RouterProvider routeList={routes} isAnimated>
			<Navbar />
			<Router spinner={false} />
		</RouterProvider>
	);
}

export default App;
