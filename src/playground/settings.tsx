import { useMemo, useState, type ReactNode } from 'react';
import type { RouterProps } from '../clear-router';
import { SettingsContext } from './settings-context';
import type { NavLinkAs } from './NavLinkAs';

export type PrefetchSetting = 'auto' | NonNullable<RouterProps['defaultPrefetch']>;

export type PlaygroundSettings = {
	isAnimated: boolean;
	showStatusBadge: boolean;
	showCacheVisualizer: boolean;
	animationDuration: number | undefined;
	maxCacheSize: number;
	defaultPrefetch: PrefetchSetting;
	minLoaderDuration: number | undefined;
	navLinkAs: NavLinkAs;
};

export const PlaygroundSettingsProvider = ({ children }: { children: ReactNode }) => {
	const [isAnimated, setIsAnimated] = useState(false);
	const [showStatusBadge, setShowStatusBadge] = useState(true);
	const [showCacheVisualizer, setShowCacheVisualizer] = useState(true);
	const [animationDuration, setAnimationDuration] = useState<number | undefined>(undefined);
	const [maxCacheSize, setMaxCacheSize] = useState(3);
	const [defaultPrefetch, setDefaultPrefetch] = useState<PrefetchSetting>('auto');
	const [minLoaderDuration, setMinLoaderDuration] = useState<number | undefined>(0);
	const [navLinkAs, setNavLinkAs] = useState<NavLinkAs>('link');
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
			showCacheVisualizer,
			setShowCacheVisualizer,
			defaultPrefetch,
			setDefaultPrefetch,
			minLoaderDuration,
			setMinLoaderDuration,
			navLinkAs,
			setNavLinkAs,
		}),
		[
			isAnimated,
			animationDuration,
			maxCacheSize,
			showStatusBadge,
			showCacheVisualizer,
			defaultPrefetch,
			minLoaderDuration,
			navLinkAs,
		]
	);
	return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};
