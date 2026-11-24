import { Button as MantineButton } from '@mantine/core';
import type { ElementProps } from '../clear-router';

type Props = ElementProps<HTMLAnchorElement> & { variant: 'gradient' | 'subtle'; size: 'compact-md' };

const MantineNavButton = (props: Props) => (
	<MantineButton {...props} component="a" gradient={{ from: 'teal', to: 'blue', deg: 60 }} />
);

export default MantineNavButton;
