import { useContext } from 'react';
import { SettingsContext } from './settings-context';

export const usePlaygroundSettings = () => {
	const ctx = useContext(SettingsContext);
	if (!ctx) throw new Error('usePlaygroundSettings must be used inside PlaygroundSettingsProvider');
	return ctx;
};
