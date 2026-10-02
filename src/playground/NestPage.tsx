import { useMemo } from 'react';
import { Link, useLoaderState, useParams } from '../clear-router';
import { getCallCount } from './api';

const randomIds = (prefix: string) => {
	const ids = new Set<number>();
	while (ids.size < 3) ids.add(Math.floor(Math.random() * 90) + 10);
	return [...ids].map(n => `${prefix}-${n}`);
};

export const NestPage = () => {
	const nestIds = useMemo(() => randomIds('nest'), []);
	return (
		<div className="pg-wrap">
			<h1>Nested routes</h1>
			<p className="pg-hint">
				Real nested definitions (<code>children</code> in the route config), double-nested with params at
				each level. IDs below are re-rolled on every visit — pick a nest, then pick an item inside it. Same
				params render instantly from cache, new params run the loader.
			</p>
			<div className="pg-row">
				{nestIds.map(id => (
					<Link key={id} to={`/playground/nest/${id}`} prefetch="none">
						{id}
					</Link>
				))}
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export const NestChildPage = () => {
	const { nestId } = useParams<{ nestId: string }>();
	const { data } = useLoaderState<{ description: string }>();
	const itemIds = useMemo(() => randomIds('item'), []);
	return (
		<div className="pg-wrap">
			<h1>Nest {nestId}</h1>
			<div className="pg-card">
				<p>{data.description}</p>
				<p>
					<span className="pg-badge">loader calls: {getCallCount(`nest-${nestId}`)}</span>
				</p>
			</div>
			<div className="pg-row">
				{itemIds.map(itemId => (
					<Link key={itemId} to={`/playground/nest/${nestId}/item/${itemId}`} prefetch="none">
						{itemId}
					</Link>
				))}
			</div>
			<p>
				<Link to="/playground/nest">← Back to nests</Link>
			</p>
		</div>
	);
};

export const NestItemPage = () => {
	const { nestId, itemId } = useParams<{ nestId: string; itemId: string }>();
	const { data } = useLoaderState<{ description: string }>();
	return (
		<div className="pg-wrap">
			<h1>
				Item {itemId} of nest {nestId}
			</h1>
			<div className="pg-card">
				<p>{data.description}</p>
				<p>
					<span className="pg-badge">loader calls: {getCallCount(`nest-${nestId}-${itemId}`)}</span>
				</p>
			</div>
			<p>
				<Link to={`/playground/nest/${nestId}`}>← Back to nest {nestId}</Link>
			</p>
		</div>
	);
};
