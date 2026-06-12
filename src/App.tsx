import { Router } from 'clear-react-router';
import { routes } from './routes.ts';

function App() {
	return <Router routeList={routes} />;
}

export default App;
