import { Link, useSearchParams } from '../clear-router';

const BRANDS = ['nike', 'reebok', 'adidas'];

const SearchPage = () => {
	const { searchParams, getSearchParams, setSearchParams } = useSearchParams();
	const active = getSearchParams('brand');

	return (
		<div className="pg-wrap">
			<h1>Search params</h1>
			<p className="pg-hint">
				The URL query string updates as you click — no navigation, no loader restart. `getSearchParams` returns
				an array when a key has multiple values.
			</p>
			<div className="pg-card">
				<div className="pg-row">
					{BRANDS.map(brand => (
						<button
							key={brand}
							className="pg-btn"
							onClick={() => {
								const current = getSearchParams('brand');
								const list = Array.isArray(current) ? current : current ? [current] : [];
								setSearchParams(
									'brand',
									list.includes(brand) ? list.filter(b => b !== brand) : [...list, brand]
								);
							}}
						>
							{brand}
						</button>
					))}
					<button className="pg-btn" onClick={() => setSearchParams('page', '2')}>
						page=2
					</button>
				</div>
				<p>
					URL query: <code>{searchParams.toString() || '(empty)'}</code>
				</p>
				<p>
					<code>getSearchParams(&apos;brand&apos;)</code>: <code>{JSON.stringify(active)}</code>
				</p>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default SearchPage;
