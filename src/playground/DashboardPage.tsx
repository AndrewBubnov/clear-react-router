import { Link } from '../clear-router';

const DashboardPage = () => (
	<div className="pg-wrap">
		<h1>Dashboard</h1>
		<div className="pg-card">
			<p>
				<span className="pg-badge ok">authorized area</span>
			</p>
			<p>You only see this because `beforeLoad` let you through.</p>
		</div>
		<p>
			<Link to="/playground">← Back to playground home</Link>
		</p>
	</div>
);

export default DashboardPage;
