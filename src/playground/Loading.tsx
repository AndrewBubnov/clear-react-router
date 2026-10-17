import { Loader } from '@mantine/core';

export const Loading = ({ title }: { title: string }) => (
	<div className="loader-wrap">
		<div>Loading {title}…</div>
		<Loader />
	</div>
);
