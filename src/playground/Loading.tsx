export const Loading = ({ title }: { title: string }) => (
	<div className="loader-wrap">
		<div>Loading {title}…</div>
		<span className="loader" />
	</div>
);
