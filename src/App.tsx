import { Router } from './clear-router';
import { routes } from './routes.ts';

function App() {
	return <Router routeList={routes} isAnimated />;
}

export default App;
