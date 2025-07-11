
import { fetchCurrentUser } from "./API_Handler/auth";

export async function authLoader() {
  try {
    const userData = await fetchCurrentUser();
    if (
      userData &&
      userData["user_type"] &&
      userData["roles"] &&
      userData["roles"].length > 0
    ) {
      return userData;
    } else {
      return null; // handle as unauthenticated
    }
  } catch (err) {
    return null; // treat fetch error as unauthenticated
  }
}

