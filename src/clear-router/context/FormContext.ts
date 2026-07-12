import { createContext } from 'react';

export type FormContextProps = { isSubmitting: boolean };

export const FormContext = createContext<FormContextProps>({ isSubmitting: false });
