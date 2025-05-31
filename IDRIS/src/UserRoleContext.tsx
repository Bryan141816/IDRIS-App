import { createContext, useContext, useState, ReactNode } from 'react';

type UserRoleContextType = {
  userRole: string;
  setUserRole: (role: string) => void;
};

export const UserRoleContext = createContext<UserRoleContextType>({
  userRole: '',
  setUserRole: () => {},
});

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  // Initialize from localStorage if it exists
  const [userRole, setUserRoleState] = useState(() => {
    return localStorage.getItem('userRole') || '';
  });

  const setUserRole = (role: string) => {
    setUserRoleState(role);
    localStorage.setItem('userRole', role);
  };

  return (
    <UserRoleContext.Provider value={{ userRole, setUserRole }}>
      {children}
    </UserRoleContext.Provider>
  );
};

// Custom hook to access full context
export const useUserRoleContext = () => useContext(UserRoleContext);

// Optional: Custom hook to get just the userRole
export const useUserRole = () => {
  const { userRole } = useUserRoleContext();
  return userRole;
};
