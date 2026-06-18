import { Router } from './clear-router';
import { routes } from './routes.ts';
import { RouterProvider } from './clear-router/components/RouterProvider.tsx';

function App() {
	return (
		<RouterProvider routeList={routes} isAnimated animationOptions={{ duration: 500, name: 'slide-left' }}>
			<Router />
		</RouterProvider>
	);
}

export default App;
