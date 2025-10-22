// src/api/auth.ts

// src/api/auth.ts
import { API } from './Axio_API_Handler';
import { setAccessToken, clearAccessToken } from './token_store';
/**
 * Logs in the user by setting the HttpOnly cookie from FastAPI.
 * No need to manually handle the token.
 */
export async function loginUser(email: string, password: string): Promise<void> {
  const res = await API.post(
    '/login',
    { email, password },
  );
  const token = res.data.access_token;
  setAccessToken(token)
}

/**
 * Fetches the currently authenticated user using the cookie token.
 */

export async function fetchCurrentUser(): Promise<any | null> {
  try {
    const userResponse = await API.get("/users/me");
    if (userResponse.data) {
      try {
        const profileResponse = await API.get("/user-profile/me");
        userResponse.data.user_profile = profileResponse.data;
      } catch (profileError: any) {
        if (
          profileError.response &&
          (profileError.response.status === 404 ||
            profileError.response.status === 401)
        ) {
          userResponse.data.user_profile = null;
        } else {
          throw profileError;
        }
      }
    }
    return userResponse.data;
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      return null;
    }
    throw error; // rethrow other errors
  }
}


/**
 * Logs out the user by telling the backend to clear the cookie.
 */
export async function logoutUser(): Promise<void> {
  await API.post('/logout', {});
  clearAccessToken()
}

export async function fetchCurrentUserId(): Promise<any> {
  try{
    const response = await API.get('/users/me/id', {});
    return response.data
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      return null;
    }
    throw error; // rethrow other errors
  }

}