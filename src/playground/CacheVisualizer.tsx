import { CSSProperties, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, Card, Group, Loader, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconArrowRight, IconBolt, IconRefresh, IconReload } from '@tabler/icons-react';
import { useCacheSnapshot, type CacheReason, type CacheSnapshotEntry } from '../clear-router';

const VISIBLE_LIMIT = 6;

type DisplayItem = { entry: CacheSnapshotEntry; reason: CacheReason };

const REASON = {
	navigation: {
		bg: 'rgba(34,160,107,0.14)',
		border: 'rgba(34,160,107,0.9)',
		theme: 'green',
		label: 'navigation',
	},
	prefetch: {
		bg: 'rgba(112,72,232,0.14)',
		border: 'rgba(112,72,232,0.9)',
		theme: 'violet',
		label: 'prefetch',
	},
	invalidate: {
		bg: 'rgba(217,72,15,0.13)',
		border: 'rgba(217,72,15,0.9)',
		theme: 'orange',
		label: 'invalidate',
	},
	polling: {
		bg: 'rgba(51,112,180,0.12)',
		border: 'rgba(51,112,180,0.9)',
		theme: 'blue',
		label: 'polling',
	},
} as const;

const BATTERY_PICES_COUNT = 4;

const REASON_ICON = {
	navigation: IconArrowRight,
	prefetch: IconBolt,
	invalidate: IconReload,
	polling: IconRefresh,
} as const;

const shortLabel = (path: string) => {
	const segments = path.split('?')[0].split('/').filter(Boolean);
	return segments[segments.length - 1] ?? '/';
};

const freshnessColor = (stale: boolean) => (stale ? 'var(--mantine-color-orange-6)' : 'var(--mantine-color-teal-6)');

const FreshnessLegend = () => (
	<Group gap={10}>
		{[false, true].map(stale => (
			<Group key={String(stale)} gap={4}>
				<span style={{ width: 7, height: 7, borderRadius: '50%', background: freshnessColor(stale) }} />
				<Text size="9px" c="dimmed" tt="uppercase" fw={700}>
					{stale ? 'stale' : 'fresh'}
				</Text>
			</Group>
		))}
	</Group>
);

const Battery = ({ item }: { item: DisplayItem }) => {
	const { entry, reason } = item;
	const style = REASON[reason];

	const [elapsed] = useState(() => Date.now() - entry.timestamp);

	const hasWindow = Number.isFinite(entry.staleTime);
	const staleTime = hasWindow ? entry.staleTime! : 0;
	const pieceMs = staleTime / BATTERY_PICES_COUNT;
	return (
		<div className="pg-battery-wrap">
			<span
				className="pg-battery-dot"
				data-animated={hasWindow || undefined}
				title={hasWindow ? `fresh for ${staleTime / 1000}s` : 'never goes stale'}
				style={{ '--dot-delay': `${staleTime - elapsed}ms` } as CSSProperties}
			/>
			<div className="pg-battery">
				{Array.from({ length: BATTERY_PICES_COUNT }, (_, index) => (
					<div
						key={index}
						className="pg-battery-piece"
						style={
							{
								'background':
									reason === 'navigation' || reason === 'prefetch' ? style.border : 'transparent',
								'--seg-drain-delay': `${(BATTERY_PICES_COUNT - index) * pieceMs - elapsed}ms`,
							} as CSSProperties
						}
					/>
				))}
			</div>
		</div>
	);
};

const CardIcon = ({ isLoading, item }: { isLoading: boolean; item: DisplayItem }) => {
	const Icon = REASON_ICON[item.reason];
	const style = REASON[item.reason];
	return (
		<ThemeIcon size={24} radius="xl" variant="light" color={style.theme}>
			<AnimatePresence mode="wait">
				{isLoading ? (
					<motion.div
						key="loader"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
						style={{ display: 'flex' }}
					>
						<Loader size={12} color={style.theme} />
					</motion.div>
				) : (
					<AnimatePresence mode="wait">
						<motion.div
							key="icon"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							transition={{ duration: 0.2 }}
							style={{ display: 'flex' }}
						>
							<Icon size={16} stroke={2} />
						</motion.div>
					</AnimatePresence>
				)}
			</AnimatePresence>
		</ThemeIcon>
	);
};

const CacheCard = ({ item }: { item: DisplayItem }) => {
	const style = REASON[item.reason];
	const { entry, reason } = item;
	return (
		<motion.div
			data-loading={entry.isLoading ? 'true' : undefined}
			initial={{ opacity: 0, y: 10, backgroundColor: style.bg, borderColor: style.border }}
			animate={{ opacity: 1, y: 0, backgroundColor: style.bg, borderColor: style.border }}
			exit={{ opacity: 0 }}
			transition={{ type: 'spring', stiffness: 200, damping: 35 }}
			title={entry.path}
			className="pg-cache-viz-card"
			style={{ borderColor: style.border, backgroundColor: style.bg }}
		>
			<Battery key={`${entry.timestamp}-${entry.staleTime}-${reason}`} item={item} />
			<CardIcon isLoading={entry.isLoading} item={item} />
			<Text size="xs" fw={700} truncate style={{ maxWidth: '100%' }} c={style.theme}>
				{shortLabel(entry.path)}
			</Text>
			<Text size="10px" truncate style={{ maxWidth: '100%', opacity: 0.9 }} c={style.theme}>
				{style.label}
			</Text>
			{entry.gcExpiresAt && (
				<div
					className="pg-gc-progress"
					style={{ '--progress-duration': `${entry.gcDuration}ms` } as CSSProperties}
				/>
			)}
		</motion.div>
	);
};

export const CacheVisualizer = ({ maxSlots }: { maxSlots: number }) => {
	const entries = useCacheSnapshot();
	const cached = entries.filter(entry => entry.isCached);
	const items: DisplayItem[] = cached.map(entry => ({ entry, reason: entry.reason ?? 'navigation' }));
	const visible = items.slice(-VISIBLE_LIMIT);
	const hidden = items.length - visible.length;
	const full = cached.length >= maxSlots;
	return (
		<Card padding="sm" className="pg-visualizer">
			<Group justify="space-between" align="center" gap="xs">
				<Text fw={700} size="sm">
					Cache visualizer
				</Text>
				<Tooltip
					label={`${cached.length} entries cached now, limit ${maxSlots} — set by "Loader cache size" in settings`}
					multiline
					w={260}
				>
					<Badge variant="light" color={full ? 'orange' : 'teal'}>
						{cached.length} / {maxSlots} entries
					</Badge>
				</Tooltip>
			</Group>
			<Group justify="center" mt={6}>
				<FreshnessLegend />
			</Group>
			<div className="pg-cache-row">
				{hidden > 0 && (
					<Text size="9px" c="dimmed" style={{ alignSelf: 'center' }}>
						+{hidden} older
					</Text>
				)}
				<AnimatePresence initial={false}>
					{visible.map(item => (
						<CacheCard key={item.entry.path} item={item} />
					))}
				</AnimatePresence>
			</div>
		</Card>
	);
};
