import { Link, useLoaderState } from '../clear-router';

type QuotesData = { tick: number; quotes: { symbol: string; price: number }[] };

const LivePage = () => {
	const { data } = useLoaderState<QuotesData>();
	return (
		<div className="pg-wrap">
			<h1>Polling</h1>
			<p className="pg-hint">
				Loader revalidates every 2 seconds (<code>pollingInterval: 2000</code>) while this route is active.
				Watch the tick counter — then leave the page and come back: polling restarts, and no requests fire while
				you are away (check the network tab).
			</p>
			<div className="pg-card">
				<p>
					<span className="pg-badge">tick: {data.tick}</span>
				</p>
				<table className="pg-table">
					<thead>
						<tr>
							<th>Symbol</th>
							<th className="num">Price</th>
						</tr>
					</thead>
					<tbody>
						{data.quotes.map(q => (
							<tr key={q.symbol}>
								<td>{q.symbol}</td>
								<td className="num">${q.price.toFixed(2)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default LivePage;
