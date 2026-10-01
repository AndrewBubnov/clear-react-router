import { useMemo, useState, type ReactNode } from 'react';
import { SettingsContext } from './settings-context';

export type PlaygroundSettings = {
	isAnimated: boolean;
	animationDuration: number | undefined;
	maxCacheSize: number;
};

export const PlaygroundSettingsProvider = ({ children }: { children: ReactNode }) => {
	const [isAnimated, setIsAnimated] = useState(true);
	const [animationDuration, setAnimationDuration] = useState<number | undefined>(undefined);
	const [maxCacheSize, setMaxCacheSize] = useState(3);
	const value = useMemo(
		() => ({ isAnimated, animationDuration, maxCacheSize, setIsAnimated, setAnimationDuration, setMaxCacheSize }),
		[isAnimated, animationDuration, maxCacheSize]
	);
	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
