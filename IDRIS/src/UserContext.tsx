import { createContext, useContext, useState, ReactNode } from 'react';

type UserContextType = {
  userType: string;
  setUserType: (type: string) => void;
  email: string;
  setEmail: (email: string) => void;
  username: string;
  setUsername: (username: string) => void;
};

export const UserContext = createContext<UserContextType>({
  userType: '',
  setUserType: () => {},
  email: '',
  setEmail: () => {},
  username: '',
  setUsername: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserTypeState] = useState(() => {
    return localStorage.getItem('userType') || '';
  });

  const [email, setEmailState] = useState(() => {
    return localStorage.getItem('email') || '';
  });

  const [username, setUsernameState] = useState(() => {
    return localStorage.getItem('username') || '';
  });

  const setUserType = (type: string) => {
    setUserTypeState(type);
    localStorage.setItem('userType', type);
  };

  const setEmail = (email: string) => {
    setEmailState(email);
    localStorage.setItem('email', email);
  };

  const setUsername = (username: string) => {
    setUsernameState(username);
    localStorage.setItem('username', username);
  };

  return (
    <UserContext.Provider
      value={{ userType, setUserType, email, setEmail, username, setUsername }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
