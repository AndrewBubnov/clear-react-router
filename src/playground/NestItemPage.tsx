import { useLoaderState, useParams } from '../clear-router';
import { AppLink } from './AppLink';
import { getCallCount } from './api';

const NestItemPage = () => {
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
				<AppLink path="/playground/nest/:nestId" params={{ nestId }}>
					← Back to nest {nestId}
				</AppLink>
			</p>
		</div>
	);
};

export default NestItemPage;
