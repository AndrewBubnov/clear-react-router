import { Link, useLoaderState, useParams } from '../clear-router';
import { getCallCount } from './api';

const ProductPage = () => {
	const { productId } = useParams<{ productId: string }>();
	const { data } = useLoaderState<{ id: string; description: string; loads: number }>();
	return (
		<div className="pg-wrap">
			<h1>Product {data.id}</h1>
			<div className="pg-card">
				<p>{data.description}</p>
				<p>
					<span className="pg-badge">
						loader calls for #{productId}: {getCallCount(`product-${productId}`)}
					</span>
				</p>
			</div>
			<p>
				<Link to="/playground/cache">← Back to cache lab</Link>
			</p>
		</div>
	);
};

export default ProductPage;
