import './App.css';
import { Router } from './Router/Router.tsx';
import { routeList } from './router.tsx';

function App() {
	return <Router routeList={routeList} />;
}

export default App;
