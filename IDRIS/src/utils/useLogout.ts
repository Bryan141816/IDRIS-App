import { useUserContext } from "../UserContext";
import { useUserRoleContext } from "../UserRoleContext";
import { logoutUser } from "../API_Handler/auth";

export const useLogout = () => {
  const { setUserId, setUserType, setEmail, setUsername, setUserReady } =
    useUserContext();
  const { setUserRoles } = useUserRoleContext();

  const logout = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout API call failed:", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("accessToken");

      setUserId(null);
      setUserType("");
      setEmail("");
      setUsername("");
      setUserRoles([]);
      setUserReady(false);
      window.location.assign("/login");
    }
  };

  return logout;
};