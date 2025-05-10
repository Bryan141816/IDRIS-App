import { createContext, useContext } from 'react';

export const UserContext = createContext<{ userType: string }>({ userType: 'user' });

export const useUserContext  = () => useContext(UserContext);
