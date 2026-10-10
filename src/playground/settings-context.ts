import { createContext } from 'react';
import type { PlaygroundSettings, PrefetchSetting } from './settings';

export type SettingsContextValue = PlaygroundSettings & {
	setIsAnimated(value: boolean): void;
	setAnimationDuration(value: number | undefined): void;
	setMaxCacheSize(value: number): void;
	setShowStatusBadge(value: boolean): void;
	setDefaultPrefetch(value: PrefetchSetting): void;
	setMinLoaderDuration(value: number | undefined): void;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);
