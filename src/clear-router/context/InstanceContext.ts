import { createContext } from 'react';
import { RouterType } from '../types/global';

export const InstanceContext = createContext<RouterType>({} as RouterType);
