import { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  userType: string;
  email: string;
  username: string;
  isUserReady: boolean;
  setUserType: (type: string) => void;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
  setUserReady: (ready: boolean) => void;
};

export const UserContext = createContext<UserContextType>({
  userType: "",
  email: "",
  username: "",
  isUserReady: false,
  setUserType: () => {},
  setEmail: () => {},
  setUsername: () => {},
  setUserReady: () => {},
});
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isUserReady, setUserReady] = useState(false); // ✅

  return (
    <UserContext.Provider
      value={{
        userType,
        setUserType,
        email,
        setEmail,
        username,
        setUsername,
        isUserReady, // ✅
        setUserReady, // ✅
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
