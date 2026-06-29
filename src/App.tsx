import { Router, RouterProvider } from './clear-router';
import { routes } from './routes';
import { Navbar } from './components/Navbar';

function App() {
	return (
		<RouterProvider routeList={routes}>
			<Navbar />
			<div style={{ marginTop: 100 }}>
				<Router isAnimated animationDuration={1200} />
			</div>
		</RouterProvider>
	);
}

export default App;
