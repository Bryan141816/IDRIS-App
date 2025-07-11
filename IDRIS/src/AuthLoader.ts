
// loaders/authLoader.ts
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
      throw new Response("Invalid user data", { status: 401 });
    }
  } catch (err) {
    throw new Response("Failed to load user", { status: 401 });
  }
}
