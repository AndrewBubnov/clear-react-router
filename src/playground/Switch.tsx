import { cloneElement, CSSProperties, ReactElement } from 'react';

type SwitchProps = {
	checked: boolean;
	onCheckedChange(value: boolean): void;
	children: ReactElement<{ style: CSSProperties }>;
};

export const Switch = ({ checked, onCheckedChange, children }: SwitchProps) => (
	<button
		type="button"
		role="switch"
		aria-checked={checked}
		className="pg-switch"
		onClick={() => onCheckedChange(!checked)}
	>
		<span className="pg-toggle" aria-hidden="true" />
		{cloneElement(children, { style: { paddingBottom: 3 } })}
	</button>
);
