import { Router } from './clear-router';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import './playground/playground.css';

const App = () => (
	<div>
		<PlaygroundNav />
		<Router routes={playgroundRoutes} />
	</div>
);

export default App;
