import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { API } from "../../API_Handler/Axio_API_Handler";
import { useNavigate } from "react-router-dom";
import "./styles/Login.scss";
import { useUserRoleContext } from "../../UserRoleContext";
import { fetchCurrentUser } from "../../API_Handler/auth.ts";
import { useUserContext } from "../../UserContext";
const OauthCallback = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get("token");

  const { setUserRoles } = useUserRoleContext();
  const { setUserType, setEmail, setUsername, setUserReady } = useUserContext();

  const navigate = useNavigate();
  useEffect(() => {
    const login = async () => {
      try {
        const response = await API.post(`/auth/callback/login?token=${token}`);
        const userData = await fetchCurrentUser();

        if (userData) {
          setUserType(userData["user_type"]);
          setUserRoles(userData["roles"]);
          setEmail(userData["email"]);
          setUsername(userData["username"]);
          setUserReady(true);
          if (userData["roles"].includes("super admin")) {
            navigate("/volunteer_management/volunteer_dashboard");
          } else if (userData["roles"].includes("volunteer")) {
            navigate("/volunteer_management/volunteer_dashboard");
          } else if (userData["roles"].includes("operations admin")) {
            navigate("/donations_management/donations_dashboard");
          } else {
            navigate("/donations_management/donations_dashboard");
          }
        } else {
          throw new Error("Invalid user data received.");
        }
      } catch (error) {
        console.error(error);
      }
    };

    login();
    // call the async function
  }, []);
  return <div>Logging In</div>;
};
export default OauthCallback;
