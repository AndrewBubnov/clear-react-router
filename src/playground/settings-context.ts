import { createContext } from 'react';
import type { PlaygroundSettings } from './settings';

export type SettingsContextValue = PlaygroundSettings & {
	setIsAnimated(value: boolean): void;
	setAnimationDuration(value: number | undefined): void;
	setMaxCacheSize(value: number): void;
	setShowStatusBadge(value: boolean): void;
};

export const SettingsContext = createContext<SettingsContextValue | null>(null);
