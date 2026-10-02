import { useMemo } from 'react';
import { Link, useLoaderState, useParams } from '../clear-router';
import { getCallCount, randomIds } from './api';

const NestChildPage = () => {
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

export default NestChildPage;
