import { Group, Skeleton, Stack } from '@mantine/core';

export const ChartFallback = () => (
	<Group align="center" gap="xl">
		<Skeleton height={180} width={180} circle />
		<Stack gap="sm" style={{ flex: 1, minWidth: 240 }}>
			{Array.from({ length: 4 }, (_, i) => (
				<Skeleton key={i} height={32} radius="sm" />
			))}
		</Stack>
	</Group>
);

export const DeferredSkeleton = () => (
	<div className="pg-wrap">
		<Skeleton height={52} width={300} mt={32} />
		<Skeleton height={78} mt={12} radius="sm" />
		<div className="pg-card">
			<Group justify="space-between" align="flex-start">
				<Stack gap={8}>
					<Skeleton height={24} width={200} />
					<Skeleton height={14} width={150} />
				</Stack>
				<Skeleton height={24} width={56} radius="xl" />
			</Group>
			<ChartFallback />
			<Group>
				<Skeleton height={30} width={104} radius="sm" />
				<Skeleton height={16} width={120} />
			</Group>
		</div>
		<Skeleton height={16} width={200} mt={8} />
	</div>
);

export const PageSkeleton = () => (
	<div className="pg-wrap">
		<Skeleton height={52} width={300} mt={32} />
		<Skeleton height={78} mt={12} radius="sm" />
		<div className="pg-card">
			<Skeleton height={24} width={200} />
			<Skeleton height={16} width="70%" />
			<Skeleton height={16} width="55%" />
			<Skeleton height={120} mt={8} radius="sm" />
		</div>
		<Skeleton height={16} width={200} mt={8} />
	</div>
);

export const ProductSkeleton = () => (
	<div className="pg-wrap">
		<Skeleton height={52} width={300} mt={32} />
		<Skeleton height={78} mt={12} radius="sm" />
		<Skeleton height={16} width={200} mt={8} />
	</div>
);
