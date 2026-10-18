import { useState, type ReactNode } from 'react';
import { Badge, Button, Card, Group, Stack, Text } from '@mantine/core';

export const NestLayout = ({ children }: { children: ReactNode }) => {
	const [count, setCount] = useState(0);
	const [mountedAt] = useState(() => new Date().toLocaleTimeString());

	return (
		<>
			<div className="pg-layout-bar">
				<Card withBorder radius="md" padding="lg">
					<Stack gap="sm">
						<Group justify="space-between" align="center">
							<Text fw={600}>Shared layout for this whole section</Text>
							<Badge variant="light" size="lg">
								mounted at {mountedAt}
							</Badge>
						</Group>
						<Text size="sm" c="dimmed">
							This card is the <code>layout</code> declared once on <code>/playground/nest</code>. Press
							Increment, then walk between a nest and its items — the count stays, so the layout was never
							remounted. It resets only when you leave the section entirely.
						</Text>
						<Group>
							<Button variant="light" onClick={() => setCount(c => c + 1)}>
								Increment
							</Button>
							<Badge color="teal" size="lg">
								count: {count}
							</Badge>
						</Group>
					</Stack>
				</Card>
			</div>
			{children}
		</>
	);
};
