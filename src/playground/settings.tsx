import { useMemo, useState, type ReactNode } from 'react';
import type { RouterProps } from '../clear-router';
import { SettingsContext } from './settings-context';

export type PrefetchSetting = 'auto' | NonNullable<RouterProps['defaultPrefetch']>;

export type PlaygroundSettings = {
	isAnimated: boolean;
	showStatusBadge: boolean;
	animationDuration: number | undefined;
	maxCacheSize: number;
	defaultPrefetch: PrefetchSetting;
	minLoaderDuration: number | undefined;
};

export const PlaygroundSettingsProvider = ({ children }: { children: ReactNode }) => {
	const [isAnimated, setIsAnimated] = useState(false);
	const [showStatusBadge, setShowStatusBadge] = useState(true);
	const [animationDuration, setAnimationDuration] = useState<number | undefined>(undefined);
	const [maxCacheSize, setMaxCacheSize] = useState(3);
	const [defaultPrefetch, setDefaultPrefetch] = useState<PrefetchSetting>('auto');
	const [minLoaderDuration, setMinLoaderDuration] = useState<number | undefined>(0);
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
			defaultPrefetch,
			setDefaultPrefetch,
			minLoaderDuration,
			setMinLoaderDuration,
		}),
		[isAnimated, animationDuration, maxCacheSize, showStatusBadge, defaultPrefetch, minLoaderDuration]
	);
	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
