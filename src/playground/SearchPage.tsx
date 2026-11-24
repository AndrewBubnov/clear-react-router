import { Link, useLoaderState, useSearchParams } from '../clear-router';
import type { SearchResults } from './api';
import { Button } from '@mantine/core';
import { motion } from 'motion/react';

const BRANDS = ['nike', 'reebok', 'adidas'];

const SearchPage = () => {
	const { searchParams, getSearchParams, setSearchParams } = useSearchParams();
	const { data } = useLoaderState<SearchResults>();
	const active = getSearchParams('brand');
	const query = searchParams.toString();
	const paramCount = Array.from(searchParams.keys()).length;

	return (
		<div className="pg-wrap">
			<h1>Search params</h1>
			<p className="pg-hint">
				Every parameter combination is a full navigation: the loader reruns with the new query and the result is
				cached per <code>pathname + search</code> — clicking a visited combination again renders instantly from
				cache (<code>optimistic</code>), a new combination keeps the previous results on screen while it loads (
				<code>keepPreviousData</code>), and the browser Back button walks your filter history.
			</p>
			<div className="pg-card">
				<div className="pg-row">
					{BRANDS.map(brand => (
						<Button
							key={brand}
							size="xs"
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
						</Button>
					))}
					<Button onClick={() => setSearchParams('page', '2')} size="xs">
						page=2
					</Button>
					<Button size="xs" disabled={!query} onClick={() => setSearchParams(() => new URLSearchParams())}>
						Clear all
					</Button>
				</div>
				<div className="pg-invalidate-result">
					<div className="pg-invalidate-result__head">
						<span className="pg-invalidate-result__title">Current search params</span>
						<span className="pg-badge">
							{paramCount === 0 ? 'empty' : `${paramCount} ${paramCount === 1 ? 'param' : 'params'}`}
						</span>
					</div>
					<motion.div
						key={query}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.18, ease: 'easeOut' }}
					>
						<div className="pg-invalidate-result__row" style={{ flexDirection: 'column' }}>
							<div className="pg-invalidate-result__entry">
								<span className="pg-badge">URL</span>
								<span
									className="pg-invalidate-result__data"
									data-testid="search-url"
									title={query || '(empty)'}
								>
									{query || '(empty)'}
								</span>
							</div>
							<div className="pg-invalidate-result__entry">
								<span className="pg-badge">getSearchParams(&apos;brand&apos;)</span>
								<span className="pg-invalidate-result__data" data-testid="search-brand">
									{JSON.stringify(active)}
								</span>
							</div>
						</div>
					</motion.div>
				</div>
			</div>
			{data && (
				<div className="pg-card">
					<div className="pg-invalidate-result">
						<div className="pg-invalidate-result__head">
							<span className="pg-invalidate-result__title">Server results (loader)</span>
							<span className="pg-badge" data-testid="search-loads">
								loader call #{data.loads}
							</span>
						</div>
						<motion.div
							key={data.fetchedAt}
							initial={{ opacity: 0, y: -6 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.18, ease: 'easeOut' }}
						>
							<div
								className="pg-invalidate-result__row"
								style={{ flexDirection: 'column' }}
								data-testid="search-results"
							>
								{data.products.map(product => (
									<div key={product} className="pg-invalidate-result__entry">
										<span className="pg-badge">{product.split(' ')[0]}</span>
										<span className="pg-invalidate-result__data">{product}</span>
									</div>
								))}
								{data.products.length === 0 && (
									<div className="pg-invalidate-result__entry">
										<span className="pg-badge">no matches</span>
									</div>
								)}
							</div>
						</motion.div>
					</div>
				</div>
			)}
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default SearchPage;
