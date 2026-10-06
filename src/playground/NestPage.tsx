import { useMemo } from 'react';
import { AppLink } from './AppLink';
import { randomIds } from './api';

const NestPage = () => {
	const nestIds = useMemo(() => randomIds('nest'), []);
	return (
		<div className="pg-wrap">
			<h1>Nested routes</h1>
			<p className="pg-hint">
				Real nested definitions (<code>children</code> in the route config), double-nested with params at each
				level. IDs below are re-rolled on every visit — pick a nest, then pick an item inside it. Same params
				render instantly from cache, new params run the loader.
			</p>
			<div className="pg-row">
				{nestIds.map(id => (
					<AppLink key={id} path="/playground/nest/:nestId" params={{ nestId: id }} prefetch="none">
						{id}
					</AppLink>
				))}
			</div>
			<p>
				<AppLink path="/playground">← Back to playground home</AppLink>
			</p>
		</div>
	);
};

export default NestPage;
