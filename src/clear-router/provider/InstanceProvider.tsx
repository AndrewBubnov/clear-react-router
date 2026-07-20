import { InstanceContext } from '../context/InstanceContext.ts';
import { PropsWithChildren } from 'react';
import { RouterType } from '../types/global';

export const InstanceProvider = ({ children, ...rest }: PropsWithChildren<RouterType>) => (
	<InstanceContext.Provider value={{ ...rest }}>{children}</InstanceContext.Provider>
);
