// AppShell.tsx
import { useEffect } from "react";
import { fetchCurrentUser } from "./API_Handler/auth.ts";
import { useUserContext } from "./UserContext";
import { useUserRoleContext } from "./UserRoleContext";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes.tsx";

export default function AppShell() {
  const { setUserType, setEmail, setUsername } = useUserContext();
  const { setUserRoles } = useUserRoleContext();
  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await fetchCurrentUser();

        if (
          userData &&
          userData["user_type"] &&
          userData["roles"] &&
          userData["roles"].length > 0
        ) {
          console.log(userData);
          setUserType(userData["user_type"]);
          setEmail(userData["email"]);
          setUsername(userData["username"]);
          setUserRoles(userData["roles"]);
        } else {
          throw new Error("Invalid user data received.");
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        setUserType("");
        setEmail("");
        setUsername("");
        setUserRoles([]);
      }
    };

    loadUser();
  }, []);

  return <RouterProvider router={router} />;
}
