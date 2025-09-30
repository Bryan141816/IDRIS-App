import {
  createContext,
  useContext,
  useMemo,
  useState,
  ReactNode,
  useCallback,
} from "react";

type UserRoleContextType = {
  userRoles: string[];
  setUserRoles: (roles: string[]) => void;
  highestRole: string | null;
};

const ROLE_PRECEDENCE: Record<string, number> = {
  volunteer: 3,
  donor: 3,
  generic: 10,
  user: 10,
};

export const UserRoleContext = createContext<UserRoleContextType>({
  userRoles: [],
  setUserRoles: () => { },
  highestRole: null,
});

export const UserRoleProvider = ({ children }: { children: ReactNode }) => {
  const [userRoles, setUserRolesState] = useState<string[]>([]);

  // Normalize to unique, lowercase roles when setting
  const setUserRoles = useCallback((roles: string[]) => {
    const norm = Array.from(new Set(roles.map((r) => r.toLowerCase().trim())));
    setUserRolesState(norm);
  }, []);

  const highestRole = useMemo(() => {
    if (userRoles.length === 0) return null;

    // find the best precedence value
    const minPrecedence = Math.min(
      ...userRoles.map((r) => ROLE_PRECEDENCE[r] ?? Infinity),
    );

    // collect all roles with that precedence
    const topRoles = userRoles.filter(
      (r) => (ROLE_PRECEDENCE[r] ?? Infinity) === minPrecedence,
    );

    // join with "/" if more than one
    return topRoles.length > 0 ? topRoles.join("/") : null;
  }, [userRoles]);

  const value = useMemo(
    () => ({ userRoles, setUserRoles, highestRole }),
    [userRoles, setUserRoles, highestRole],
  );

  return (
    <UserRoleContext.Provider value={value}>
      {children}
    </UserRoleContext.Provider>
  );
};

// Hooks
export const useUserRoleContext = () => useContext(UserRoleContext);

export const useHighestRole = (): string | null => {
  const { highestRole } = useUserRoleContext();
  return highestRole;
};

export const useHasRole = (role: string): boolean => {
  const { userRoles } = useUserRoleContext();
  return userRoles.includes(role.toLowerCase().trim());
};

export const useAtLeastRole = (role: string): boolean => {
  const highest = useHighestRole();
  const need = ROLE_PRECEDENCE[role.toLowerCase().trim()];
  // pick the first one in case of combined "donor/volunteer"
  const have = highest
    ? Math.min(...highest.split("/").map(r => ROLE_PRECEDENCE[r] ?? Infinity))
    : Infinity;

  return have <= (need ?? Infinity);
};
