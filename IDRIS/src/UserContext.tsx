import { createContext, useContext } from "react";

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

export const useUserContext = () => useContext(UserContext);