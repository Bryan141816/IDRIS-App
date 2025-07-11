// AppShell.tsx
import { useEffect } from "react";
import { useUserContext } from "./UserContext";
import { useUserRoleContext } from "./UserRoleContext";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes.tsx";
import { useLoaderData } from "react-router-dom";

export default function AppShell() {
  const { setUserType, setEmail, setUsername } = useUserContext();
  const { setUserRoles } = useUserRoleContext();

  return <RouterProvider router={router} />;
}
