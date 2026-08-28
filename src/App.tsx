import { Router } from './clear-router';
import { routes } from './routes';
import { Navbar } from './components/Navbar';

function App() {
	return (
		<main>
			<Navbar />
			<div style={{ marginTop: 100 }}>
				<Router routes={routes} isAnimated animationDuration={1200} />
			</div>
		</main>
	);
}

export default App;
