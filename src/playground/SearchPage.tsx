import { useState } from 'react';
import { Link, useLoaderState, useSearchParams } from '../clear-router';
import { createColumnHelper, tableFeatures, useTable } from '@tanstack/react-table';
import type { TablePayload, TableRow } from './api';
import { isMobile } from '../clear-router/utils/utils.ts';

// Core-only features: the URL owns filter/sort/pagination state, the loader owns
// the processed page — the table instance is a pure renderer.
const features = tableFeatures({});
const helper = createColumnHelper<typeof features, TableRow>();
const columns = helper.columns([
	helper.accessor('id', { header: 'ID' }),
	helper.accessor('product', { header: 'Product' }),
	helper.accessor('brand', { header: 'Brand' }),
	helper.accessor('price', { header: 'Price' }),
	...(isMobile() ? [] : [helper.accessor('status', { header: 'Status' })]),
]);
// Module-scope fallback: a fresh `data?.items ?? []` would invalidate the row
// model on every render.
const EMPTY_ITEMS: TableRow[] = [];

const BRANDS = ['nike', 'reebok', 'adidas'];

const SearchPage = () => {
	const { searchParams, getSearchParams, setSearchParams } = useSearchParams();
	const { data } = useLoaderState<TablePayload>();
	const [queryDraft, setQueryDraft] = useState(searchParams.get('q') ?? '');

	const sort = getSearchParams('sort') || 'id';
	const desc = getSearchParams('dir') === 'desc';
	const page = Number(searchParams.get('page')) || 1;
	const table = useTable({
		features,
		columns,
		data: data?.items ?? EMPTY_ITEMS,
	});

	const activeBrands = getSearchParams('brand');
	const selectedBrands = Array.isArray(activeBrands) ? activeBrands : activeBrands ? [activeBrands] : [];

	const toggleBrand = (brand: string) => {
		const next = selectedBrands.includes(brand)
			? selectedBrands.filter(item => item !== brand)
			: [...selectedBrands, brand];
		setSearchParams(prev => {
			prev.delete('brand');
			next.forEach(item => prev.append('brand', item));
			prev.delete('page');
			return prev;
		});
	};

	const applyQuery = () => {
		setSearchParams(prev => {
			if (queryDraft.trim()) prev.set('q', queryDraft.trim());
			else prev.delete('q');
			prev.delete('page');
			return prev;
		});
	};

	const toggleSort = (key: string) => {
		if (sort === key && !desc) {
			setSearchParams(prev => {
				prev.set('sort', key);
				prev.set('dir', 'desc');
				return prev;
			});
		} else if (sort === key && desc) {
			setSearchParams(prev => {
				prev.delete('sort');
				prev.delete('dir');
				return prev;
			});
		} else {
			setSearchParams(prev => {
				prev.set('sort', key);
				prev.set('dir', 'asc');
				return prev;
			});
		}
	};

	const turnPage = (delta: -1 | 1) => {
		const next = page + delta;
		setSearchParams(prev => {
			if (next <= 1) prev.delete('page');
			else prev.set('page', String(next));
			return prev;
		});
	};

	return (
		<div className="pg-wrap">
			<h1>Data table</h1>
			<p className="pg-hint">
				TanStack Table over loader data — the loader filters, sorts and paginates, every control writes to the
				URL search, and every combination is a cached navigation. <code>keepPreviousData</code> keeps the
				current rows on screen while a new combination loads.
			</p>
			<div className="pg-card">
				<div className="pg-row">
					<input
						className="pg-input"
						data-testid="table-q"
						placeholder="Filter rows — Enter applies"
						value={queryDraft}
						onBlur={applyQuery}
						onChange={event => setQueryDraft(event.target.value)}
						onKeyDown={event => event.key === 'Enter' && applyQuery()}
					/>
					{BRANDS.map(brand => (
						<label key={brand} className="pg-check">
							<input
								type="checkbox"
								data-testid={`brand-${brand}`}
								checked={selectedBrands.includes(brand)}
								onChange={() => toggleBrand(brand)}
							/>
							{brand}
						</label>
					))}
				</div>
				<div className="pg-row">
					<span className="pg-badge" data-testid="table-loads">
						loader call #{data?.loads ?? 0}
					</span>
					<span className="pg-badge" data-testid="table-variants">
						{Array.isArray(activeBrands) ? JSON.stringify(activeBrands) : JSON.stringify(selectedBrands)}
					</span>
				</div>
				<table className="pg-table">
					<thead>
						{table.getHeaderGroups().map(group => (
							<tr key={group.id}>
								{group.headers.map(header => {
									const key = header.column.id;
									const active = sort === key;
									return (
										<th key={header.id} align="left">
											<button
												className={active ? 'pg-sort active' : 'pg-sort'}
												data-testid={`sort-${key}`}
												onClick={() => toggleSort(key)}
											>
												{header.isPlaceholder ? null : <table.FlexRender header={header} />}
												{active ? (desc ? ' ↓' : ' ↑') : ''}
											</button>
										</th>
									);
								})}
							</tr>
						))}
					</thead>
					<tbody data-testid="table-rows">
						{table.getRowModel().rows.map(row => (
							<tr key={row.id}>
								{row.getAllCells().map(cell => (
									<td key={cell.id}>
										<table.FlexRender cell={cell} />
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
				<div className="pg-row">
					<button
						className="pg-btn"
						data-testid="table-prev"
						disabled={page <= 1}
						onClick={() => turnPage(-1)}
					>
						← Prev
					</button>
					<span className="pg-badge" data-testid="table-page">
						page {data?.page ?? page} / {data?.pageCount ?? 1}
					</span>
					<button
						className="pg-btn"
						data-testid="table-next"
						disabled={(data?.pageCount ?? 1) <= page}
						onClick={() => turnPage(1)}
					>
						Next →
					</button>
					<span className="pg-badge">{data?.total ?? 0} rows on the server</span>
				</div>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default SearchPage;
