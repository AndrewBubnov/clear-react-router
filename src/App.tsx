import { Router } from 'clear-react-router';
import { routes } from './routes.ts';

function App() {
	return <Router routeList={routes} isAnimated animationOptions={{ duration: 500, name: 'slide-left' }} />;
}

export default App;
