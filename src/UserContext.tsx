import { createContext, useContext, useState, ReactNode } from 'react';

type UserContextType = {
  userType: string;
  setUserType: (type: string) => void;
};

export const UserContext = createContext<UserContextType>({
  userType: '',
  setUserType: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage if exists, else default to empty string
  const [userType, setUserTypeState] = useState(() => {
    return localStorage.getItem('userType') || '';
  });

  const setUserType = (type: string) => {
    setUserTypeState(type);
    localStorage.setItem('userType', type);
  };

  return (
    <UserContext.Provider value={{ userType, setUserType }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
