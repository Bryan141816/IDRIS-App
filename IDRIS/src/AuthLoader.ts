
import { fetchCurrentUser } from "./API_Handler/auth";
import type { LoaderFunctionArgs } from "react-router-dom";

export async function authLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const path = url.pathname;        // e.g. "/activate"
  const token = url.searchParams.get("token");

  // 🛑 Skip auth check for login, register, or activation routes
  if (
    path === "/login" ||
    path === "/register" ||
    (path === "/activate" && token)
  ) {
    return null;
  }

  try {
    const userData = await fetchCurrentUser();

    if (
      userData &&
      userData.user_type &&
      userData.roles &&
      userData.roles.length > 0
    ) {
      return userData;
    } else {
      return null; // unauthenticated
    }
  } catch (err) {
    console.error("authLoader error:", err);
    return null;
  }
}

