import { InstanceContext } from '../context/InstanceContext.ts';
import { PropsWithChildren } from 'react';
import { RouterType } from '../types/global';

export const InstanceProvider = ({ children, runtime, state }: PropsWithChildren<RouterType>) => (
	<InstanceContext.Provider value={{ state, runtime }}>{children}</InstanceContext.Provider>
);
