

import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./token_store";

// Helper: Decode JWT payload
function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Helper: Check if token expired (with buffer to prevent edge cases)
function isTokenExpired(token: string) {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - 30 < now; // 30s buffer
}

export const API = axios.create({
  baseURL: "https://idris-app.onrender.com",
  withCredentials: true,
});

// Attach token & refresh if needed

API.interceptors.request.use(async (config) => {
  // Check if the request is for /login or /register
  console.log(config.url)

  const skipRefresh =
    config.url?.includes("/login") || config.url?.includes("/register") || config.url?.includes("/activate") || config.url?.includes("/forgot_password") || config.url?.includes("/auth/callback/login");

  // If the request is login/register → skip token logic
  if (skipRefresh) {
    return config;
  }

  let token = getAccessToken() ?? "";

  // If token expired → try refreshing
  if (token === "" || isTokenExpired(token)) {
    try {
      const res = await axios.post("https://idris-app.onrender.com/refresh", null, {
        withCredentials: true,
      });
      token = res.data.access_token;
      setAccessToken(token);
    } catch (err) {
      clearAccessToken();
      return Promise.reject(err);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


API.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

