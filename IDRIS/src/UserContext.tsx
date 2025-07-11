import { createContext, useContext, useState, ReactNode } from "react";

type UserContextType = {
  userType: string;
  email: string;
  username: string;
  setUserType: (type: string) => void;
  setEmail: (email: string) => void;
  setUsername: (username: string) => void;
};

export const UserContext = createContext<UserContextType>({
  userType: "",
  email: "",
  username: "",
  setUserType: () => {},
  setEmail: () => {},
  setUsername: () => {},
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userType, setUserType] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  return (
    <UserContext.Provider
      value={{ userType, setUserType, email, setEmail, username, setUsername }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => useContext(UserContext);
