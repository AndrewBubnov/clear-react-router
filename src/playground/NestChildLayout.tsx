import { type ReactNode } from 'react';
import { Badge, Group, Paper, Text } from '@mantine/core';
import { useParams } from './clear-router';

export const NestChildLayout = ({ children }: { children: ReactNode }) => {
	const { nestId } = useParams();

	return (
		<div className="pg-layout-bar">
			<Paper withBorder radius="md" p="md">
				<Group justify="space-between" align="center">
					<Text fw={600}>Nested layout</Text>
					<Badge variant="light" color="grape">
						scope: {nestId}
					</Badge>
				</Group>
				<Text size="sm" c="dimmed">
					A second <code>layout</code> declared on <code>/playground/nest/:nestId</code>. It stacks inside the
					section card above — the outer one never remounts, so both hold across item navigation.
				</Text>
			</Paper>
			{children}
		</div>
	);
};
