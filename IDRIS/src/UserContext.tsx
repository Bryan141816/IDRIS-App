import { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  userId: number | null;
  userType: string;
  email: string;
  username: string;
  isUserReady: boolean;
  setUserId: (id: number | null) => void;
  setUserType: (type: string) => void;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  setUserReady: (ready: boolean) => void;
};

export const UserContext = createContext<UserContextType>({
  userId: null,
  userType: "",
  email: "",
  username: "",
  isUserReady: false,
  setUserId: () => {},
  setUserType: () => {},
  setEmail: () => {},
  setUsername: () => {},
  setUserReady: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isUserReady, setUserReady] = useState(false);

  return (
    <UserContext.Provider
      value={{
        userId,
        setUserId,
        userType,
        setUserType,
        email,
        setEmail,
        username,
        setUsername,
        isUserReady,
        setUserReady,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
