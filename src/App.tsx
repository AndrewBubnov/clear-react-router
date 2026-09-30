import { Router } from './clear-router';
import { PlaygroundNav } from './playground/PlaygroundNav';
import { playgroundRoutes } from './playground/routes';
import './playground/playground.css';

const App = () => (
	<div>
		<PlaygroundNav />
		{/* Tiny cache on purpose: the cache lab demonstrates LRU eviction with it. */}
		<Router routes={playgroundRoutes} maxCacheSize={5} />
	</div>
);

export default App;
