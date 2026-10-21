import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Badge, Card, Group, Progress, Text, ThemeIcon } from '@mantine/core';
import { useCacheSnapshot, type CacheReason, type CacheSnapshotEntry } from './clear-router';

const VISIBLE_LIMIT = 6;

type DisplayItem = { entry: CacheSnapshotEntry; reason: CacheReason };

const REASON = {
	navigation: {
		bg: 'rgba(34,160,107,0.14)',
		border: 'rgba(34,160,107,0.9)',
		color: '#1f8f60',
		theme: 'green',
		icon: '→',
		label: 'navigation',
	},
	prefetch: {
		bg: 'rgba(112,72,232,0.14)',
		border: 'rgba(112,72,232,0.9)',
		color: '#6741d9',
		theme: 'violet',
		icon: '↯',
		label: 'prefetch',
	},
	invalidate: {
		bg: 'rgba(217,72,15,0.13)',
		border: 'rgba(217,72,15,0.9)',
		color: '#c2410c',
		theme: 'orange',
		icon: '↻',
		label: 'invalidate',
	},
	polling: {
		bg: 'rgba(51,112,180,0.12)',
		border: 'rgba(51,112,180,0.9)',
		color: '#3370b4',
		theme: 'blue',
		icon: '⟳',
		label: 'polling',
	},
} as const;

const shortLabel = (path: string) => {
	const segments = path.split('?')[0].split('/').filter(Boolean);
	return segments[segments.length - 1] ?? '/';
};

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
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8, y: 10, backgroundColor: style.bg, borderColor: style.border }}
			animate={{ opacity: 1, scale: 1, y: 0, backgroundColor: style.bg, borderColor: style.border }}
			exit={{ opacity: 0, scale: 0.9 }}
			transition={{ type: 'spring', stiffness: 420, damping: 30 }}
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
			}}
		>
			<ThemeIcon size={24} radius="xl" variant="light" color={style.theme}>
				<span style={{ fontSize: 14, lineHeight: 1 }}>{style.icon}</span>
			</ThemeIcon>
			<Text size="xs" fw={700} truncate style={{ maxWidth: '100%', color: style.color }}>
				{shortLabel(entry.path)}
			</Text>
			<Text size="10px" truncate style={{ maxWidth: '100%', color: style.color, opacity: 0.9 }}>
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
	const rowRef = useRef<HTMLDivElement>(null);
	const cached = entries.filter(entry => !entry.inFlight);
	const items: DisplayItem[] = cached.map(entry => ({ entry, reason: entry.reason ?? 'navigation' }));
	const visible = items.slice(-VISIBLE_LIMIT);
	const hidden = items.length - visible.length;
	const full = cached.length >= maxSlots;
	useEffect(() => {
		const row = rowRef.current;
		if (row) row.scrollLeft = row.scrollWidth;
	}, [entries]);
	return (
		<Card withBorder radius="lg" padding="sm" shadow="sm">
			<Group justify="space-between" align="center" gap="xs">
				<Text fw={700} size="sm">
					Cache visualizer
				</Text>
				<Badge variant="light" color={full ? 'orange' : 'teal'}>
					{cached.length} / {maxSlots} entries
				</Badge>
			</Group>
			<Text size="9px" c="dimmed" tt="uppercase" fw={700} mt={6}>
				oldest → newest
			</Text>
			<div
				ref={rowRef}
				style={{
					display: 'flex',
					flexWrap: 'nowrap',
					overflowX: 'auto',
					overscrollBehaviorX: 'contain',
					gap: 8,
					marginTop: 8,
					minHeight: 96,
				}}
			>
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
				{visible.length === 0 && (
					<Text size="xs" c="dimmed">
						No cached entries yet.
					</Text>
				)}
			</div>
		</Card>
	);
};
