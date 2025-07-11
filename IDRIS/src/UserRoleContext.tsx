import { createContext, useContext, useState, ReactNode } from "react";

type UserRoleContextType = {
  userRoles: string[];
  setUserRoles: (roles: string[]) => void;
};

export const UserRoleContext = createContext<UserRoleContextType>({
  userRoles: [],
  setUserRoles: () => {},
});

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [userRoles, setUserRolesState] = useState<string[]>([]);

  const setUserRoles = (roles: string[]) => {
    setUserRolesState(roles);
  };

  return (
    <UserRoleContext.Provider value={{ userRoles, setUserRoles }}>
      {children}
    </UserRoleContext.Provider>
  );
};

// Custom hook to access full context
export const useUserRoleContext = () => useContext(UserRoleContext);

// Optional: Hook to check if user has a specific role
export const useHasRole = (role: string): boolean => {
  const { userRoles } = useUserRoleContext();
  return userRoles.includes(role);
};
