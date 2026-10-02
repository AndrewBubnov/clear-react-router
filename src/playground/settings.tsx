import { useMemo, useState, type ReactNode } from 'react';
import { SettingsContext } from './settings-context';

export type PlaygroundSettings = {
	isAnimated: boolean;
	showStatusBadge: boolean;
	animationDuration: number | undefined;
	maxCacheSize: number;
};

export const PlaygroundSettingsProvider = ({ children }: { children: ReactNode }) => {
	const [isAnimated, setIsAnimated] = useState(true);
	const [showStatusBadge, setShowStatusBadge] = useState(true);
	const [animationDuration, setAnimationDuration] = useState<number | undefined>(undefined);
	const [maxCacheSize, setMaxCacheSize] = useState(3);
	const value = useMemo(
		() => ({
			isAnimated,
			animationDuration,
			maxCacheSize,
			setIsAnimated,
			setAnimationDuration,
			setMaxCacheSize,
			showStatusBadge,
			setShowStatusBadge,
		}),
		[isAnimated, animationDuration, maxCacheSize, showStatusBadge]
	);
	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
