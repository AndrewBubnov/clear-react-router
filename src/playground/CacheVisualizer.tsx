import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, Card, Group, Progress, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { useCacheSnapshot, type CacheReason, type CacheSnapshotEntry } from './clear-router';

const VISIBLE_LIMIT = 6;

type DisplayItem = { entry: CacheSnapshotEntry; reason: CacheReason };

const REASON = {
	navigation: {
		bg: 'rgba(34,160,107,0.14)',
		border: 'rgba(34,160,107,0.9)',
		theme: 'green',
		icon: '→',
		label: 'navigation',
	},
	prefetch: {
		bg: 'rgba(112,72,232,0.14)',
		border: 'rgba(112,72,232,0.9)',
		theme: 'violet',
		icon: '↯',
		label: 'prefetch',
	},
	invalidate: {
		bg: 'rgba(217,72,15,0.13)',
		border: 'rgba(217,72,15,0.9)',
		theme: 'orange',
		icon: '↻',
		label: 'invalidate',
	},
	polling: {
		bg: 'rgba(51,112,180,0.12)',
		border: 'rgba(51,112,180,0.9)',
		theme: 'blue',
		icon: '⟳',
		label: 'polling',
	},
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

const useNow = (interval: number) => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), interval);
		return () => window.clearInterval(id);
	}, [interval]);
	return now;
};

const CacheCard = ({ item, now }: { item: DisplayItem; now: number }) => {
	const style = REASON[item.reason];
	const { entry } = item;
	const remaining = entry.gcExpiresAt === undefined ? undefined : Math.max(0, entry.gcExpiresAt - now);
	const progress = remaining !== undefined && entry.gcDuration ? (remaining / entry.gcDuration) * 100 : undefined;
	const stale = entry.staleTime !== undefined && now - entry.timestamp > entry.staleTime;
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8, y: 10, backgroundColor: style.bg, borderColor: style.border }}
			animate={{ opacity: 1, scale: 1, y: 0, backgroundColor: style.bg, borderColor: style.border }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ type: 'spring', stiffness: 200, damping: 35 }}
			title={entry.path}
			style={{
				width: 72,
				flexShrink: 0,
				padding: '8px 6px',
				borderWidth: 2,
				borderStyle: 'solid',
				borderColor: style.border,
				borderRadius: 12,
				backgroundColor: style.bg,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 2,
				position: 'relative',
			}}
		>
			<span
				data-freshness={stale ? 'stale' : 'fresh'}
				title={stale ? 'stale: older than staleTime' : 'fresh: within staleTime'}
				style={{
					position: 'absolute',
					top: 5,
					right: 5,
					width: 7,
					height: 7,
					borderRadius: '50%',
					background: freshnessColor(stale),
				}}
			/>
			<ThemeIcon size={24} radius="xl" variant="light" color={style.theme}>
				<span style={{ fontSize: 14, lineHeight: 1 }}>{style.icon}</span>
			</ThemeIcon>
			<Text size="xs" fw={700} truncate style={{ maxWidth: '100%' }} c={style.theme}>
				{shortLabel(entry.path)}
			</Text>
			<Text size="10px" truncate style={{ maxWidth: '100%', opacity: 0.9 }} c={style.theme}>
				{style.label}
			</Text>
			{progress !== undefined && remaining !== undefined && (
				<Progress
					value={progress}
					size={3}
					radius="xl"
					w="100%"
					mt={2}
					color={remaining > 0 ? 'teal' : 'gray'}
				/>
			)}
		</motion.div>
	);
};

export const CacheVisualizer = ({ maxSlots }: { maxSlots: number }) => {
	const entries = useCacheSnapshot();
	const now = useNow(100);
	const cached = entries.filter(entry => !entry.inFlight);
	const items: DisplayItem[] = cached.map(entry => ({ entry, reason: entry.reason ?? 'navigation' }));
	const visible = items.slice(-VISIBLE_LIMIT);
	const hidden = items.length - visible.length;
	const full = cached.length >= maxSlots;
	return (
		<Card withBorder radius="lg" padding="sm" shadow="sm">
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
						<CacheCard key={item.entry.path} item={item} now={now} />
					))}
				</AnimatePresence>
				{!visible.length && (
					<Text size="xs" c="dimmed">
						No cached entries yet.
					</Text>
				)}
			</div>
		</Card>
	);
};
