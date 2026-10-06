import { useMemo } from 'react';
import { useLoaderState, useParams } from '../clear-router';
import { AppLink } from './AppLink';
import { getCallCount, randomIds } from './api';

const NestChildPage = () => {
	const { nestId } = useParams();
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
					<AppLink
						key={itemId}
						path="/playground/nest/:nestId/item/:itemId"
						params={{ nestId, itemId }}
						prefetch="none"
					>
						{itemId}
					</AppLink>
				))}
			</div>
			<p>
				<AppLink path="/playground/nest">← Back to nests</AppLink>
			</p>
		</div>
	);
};

export default NestChildPage;
