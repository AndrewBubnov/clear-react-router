import { createRouter, useAction, useSubmitAction } from '../..';

type SettingsInput = { delayMs: number; failMode?: boolean };

// A route action declares its own payload type — no casts, no Record<string, unknown>.
export const routes = createRouter([
	{
		path: '/settings',
		element: null,
		actions: () => ({
			save: async (data: SettingsInput) => data.delayMs,
		}),
	},
]);

// Legacy untyped handlers and no-arg actions keep compiling.
export const legacyRoutes = createRouter([
	{
		path: '/legacy',
		element: null,
		actions: () => ({
			save: async (data: Record<string, unknown>) => data,
			ping: async () => 'pong',
		}),
	},
]);

// The payload type is declared once at the hook and enforced on every call.
export const TypedSubmitProbe = () => {
	const { submit } = useSubmitAction<SettingsInput>('save');
	const run = () => submit({ delayMs: 300 });
	// @ts-expect-error — wrong field type
	const wrongFieldType = () => submit({ delayMs: 'oops' });
	// @ts-expect-error — missing required field
	const missingField = () => submit({});
	// @ts-expect-error — typo'd field name
	const typoField = () => submit({ delayMsS: 300 });
	return `${String(run)}${String(wrongFieldType)}${String(missingField)}${String(typoField)}` && null;
};

export const TypedActionProbe = () => {
	const callAction = useAction<SettingsInput>('save');
	const ok = () => callAction({ delayMs: 300, failMode: true });
	// @ts-expect-error — wrong payload for useAction
	const wrongPayload = () => callAction({ nope: 1 });
	return `${String(ok)}${String(wrongPayload)}` && null;
};
