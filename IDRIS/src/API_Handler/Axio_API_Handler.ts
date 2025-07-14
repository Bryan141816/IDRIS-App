
import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./token_store";

export const API = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

// Request: attach access token
API.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Track refresh attempt count
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 1;

// Response: handle 401
API.interceptors.response.use(
  (res) => {
    refreshAttempts = 0; // ✅ Reset on success
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    // Skip if it's the /refresh call itself
    if (
      err.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/refresh") &&
      refreshAttempts < MAX_REFRESH_ATTEMPTS
    ) {
      originalRequest._retry = true;
      try {
        const res = await API.post("/refresh");
        const newToken = res.data.access_token;
        setAccessToken(newToken);
        refreshAttempts++;

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return API(originalRequest);
      } catch (refreshErr) {
        refreshAttempts++;
        clearAccessToken();
        return Promise.reject(refreshErr);
      }
    }

    // Final fallback


    return Promise.reject(err);
  }
);

