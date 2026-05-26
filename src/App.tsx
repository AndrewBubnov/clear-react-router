import './App.css';
import { Router } from './components/Router/Router.tsx';
import { router } from './router.tsx';

function App() {
	return <Router routes={router} />;
}

export default App;
