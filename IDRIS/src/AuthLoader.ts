

import { fetchCurrentUser } from "./API_Handler/auth";
import type { LoaderFunctionArgs } from "react-router-dom";

export async function authLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const path = url.pathname;        // e.g. "/activate"
  if (path == "/activate" || path == "/login" || path == "/register" || path == "/reset_password") {
    return null
  }
  try {
    const userData = await fetchCurrentUser();
    if (
      userData &&
      userData["user_type"] &&
      userData["roles"] &&
      userData["roles"].length > 0
    ) {
      console.log(userData)
      return userData;
    } else {
      return null; // handle as unauthenticated
    }
  } catch (err) {
    return null; // treat fetch error as unauthenticated
  }
}

