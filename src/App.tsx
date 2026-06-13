import { Router } from './clear-router';
import { routes } from './routes.ts';

function App() {
	return <Router routeList={routes} animated animationOptions={{ duration: 1000 }} />;
}

export default App;
