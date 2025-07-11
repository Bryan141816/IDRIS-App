// src/api/auth.ts

// src/api/auth.ts
import { API } from './Axio_API_Handler';

/**
 * Logs in the user by setting the HttpOnly cookie from FastAPI.
 * No need to manually handle the token.
 */
export async function loginUser(email: string, password: string): Promise<void> {
  await API.post(
    '/login',
    { email, password },
  );
}

/**
 * Fetches the currently authenticated user using the cookie token.
 */

export async function fetchCurrentUser(): Promise<any | null> {
  try {
    const response = await API.get('/users/me');
    return response.data;
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
}

