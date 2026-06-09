import './App.css';
import { Router } from './Router/components/Router.tsx';
import { routeList } from './config.ts';

function App() {
	return <Router routeList={routeList} />;
}

export default App;
