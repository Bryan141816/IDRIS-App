import { useState, ReactNode, useMemo, useEffect } from "react";
import { UserContext } from "../UserContext";
import { API } from "../API_Handler/Axio_API_Handler";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<number | null>(null);
  const [userType, setUserType] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [userImage, setUserImage] = useState<string | null>(null);
  const [isUserReady, setUserReady] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await API.get("/users/me");
        if (response.data) {
          setUserId(response.data.id);
          setUserType(response.data.user_type);
          setEmail(response.data.email);
          setUsername(response.data.username);
          if (response.data.user_profile  ) {
            setUserImage(response.data.user_profile.profile_image);
          } else {
            console.log(response);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      } finally {
        setUserReady(true);
      }
    };

    fetchUserData();
  }, []);

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