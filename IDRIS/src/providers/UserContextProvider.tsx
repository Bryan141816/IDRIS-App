import {
  useState,
  ReactNode,
  useMemo,
} from "react";
import { UserContext } from "../UserContext";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUserReady, setUserReady] = useState(false);

  const value = useMemo(
    () => ({
      userId,
      setUserId,
      userType,
      setUserType,
      email,
      setEmail,
      username,
      setUsername,
      userImage,
      setUserImage,
      isUserReady,
      setUserReady,
    }),
    [userId, userType, email, username, userImage, isUserReady],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};