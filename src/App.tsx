import { Router } from './clear-router';
import { routes } from './routes.ts';

function App() {
	return <Router routeList={routes} animated />;
}

export default App;
