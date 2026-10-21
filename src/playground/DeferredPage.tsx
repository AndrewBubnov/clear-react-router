import { Suspense, use } from 'react';
import { Badge, Button, Group, Progress, RingProgress, Skeleton, Stack, Text, ThemeIcon } from '@mantine/core';
import { Link, useInvalidate, useLoaderState } from './clear-router';
import { getCallCount } from './api';

type TrafficSlice = { label: string; color: string; value: number };
type DeferredDashboard = { call: number; fetchedAt: string; traffic: Promise<TrafficSlice[]> };

const TrafficChart = ({ traffic }: { traffic: Promise<TrafficSlice[]> }) => {
	const slices = use(traffic);
	const total = slices.reduce((sum, slice) => sum + slice.value, 0);
	return (
		<Group align="center" gap="xl">
			<RingProgress
				size={180}
				thickness={18}
				roundCaps
				sections={slices}
				label={
					<Stack gap={0} align="center">
						<Text fw={700} size="xl">
							{total}%
						</Text>
						<Text size="xs" c="dimmed">
							traffic mix
						</Text>
					</Stack>
				}
			/>
			<Stack gap="sm" style={{ flex: 1, minWidth: 240 }}>
				{slices.map(slice => (
					<Stack gap={4} key={slice.label}>
						<Group justify="space-between">
							<Group gap={8}>
								<ThemeIcon size={10} radius="xl" color={slice.color} />
								<Text size="sm">{slice.label}</Text>
							</Group>
							<Text size="sm" fw={600}>
								{slice.value}%
							</Text>
						</Group>
						<Progress value={slice.value} color={slice.color} size="sm" radius="xl" />
					</Stack>
				))}
			</Stack>
		</Group>
	);
};

const ChartFallback = () => (
	<Group align="center" gap="xl">
		<Skeleton height={180} width={180} circle />
		<Stack gap="sm" style={{ flex: 1, minWidth: 240 }}>
			{Array.from({ length: 4 }, (_, i) => (
				<Skeleton key={i} height={32} radius="sm" />
			))}
		</Stack>
	</Group>
);

const DeferredPage = () => {
	const { data } = useLoaderState<DeferredDashboard>();
	const invalidate = useInvalidate();
	return (
		<div className="pg-wrap">
			<h1>Deferred render</h1>
			<p className="pg-hint">
				The loader resolves in ~250ms, but the chart is a promise nested in its data that settles ~1.4s later.
				The page shell renders immediately and only the chart suspends into its own fallback. Press{' '}
				<em>Load again</em>: <code>invalidate()</code> refreshes the loader and the chart drops back to the
				fallback without remounting the rest of the card.
			</p>
			<div className="pg-card">
				<Group justify="space-between" align="flex-start">
					<div>
						<h2>Traffic by channel</h2>
						<Text size="sm" c="dimmed">
							loaded at {data.fetchedAt}
						</Text>
					</div>
					<Badge variant="light">call {data.call}</Badge>
				</Group>
				<Suspense fallback={<ChartFallback />}>
					<TrafficChart traffic={data.traffic} />
				</Suspense>
				<Group>
					<Button variant="light" size="xs" onClick={() => invalidate()}>
						Load again
					</Button>
					<Text size="sm" c="dimmed">
						loader calls: {getCallCount('deferred')}
					</Text>
				</Group>
			</div>
			<p>
				<Link to="/playground">← Back to playground home</Link>
			</p>
		</div>
	);
};

export default DeferredPage;
