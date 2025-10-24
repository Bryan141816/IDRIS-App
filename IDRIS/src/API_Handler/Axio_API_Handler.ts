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
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

// ✅ List of public endpoints that don't require authentication
const PUBLIC_ENDPOINTS = [
  "/login",
  "/register",
  "/activate",
  "/forgot_password",
  "/reset_password",
  "/auth/callback/login",
  "/auth/login",
  "/auth/register",
  "/auth/microsoft/login",
  "/auth/microsoft/register",
  "/auth/microsoft/callback",
  "/auth/callback",
  // ✅ NEW: Admin-specific public endpoints
  "/admin/register",
  "/admin/verify_email",
  "/admin/complete_profile",
  "/refresh"
];

// Attach token & refresh if needed
API.interceptors.request.use(async (config) => {
  console.log("Request URL:", config.url);

  // ✅ Check if the request URL matches any public endpoint
  const skipRefresh = PUBLIC_ENDPOINTS.some((endpoint) =>
    config.url?.includes(endpoint)
  );

  // If the request is public → skip token logic
  if (skipRefresh) {
    console.log("Skipping auth for public endpoint:", config.url);
    return config;
  }

  let token = getAccessToken() ?? "";

  // If token expired → try refreshing
  if (token === "" || isTokenExpired(token)) {
    try {
      console.log("Token expired or missing, refreshing...");
      const res = await axios.post("http://localhost:8000/refresh", null, {
        withCredentials: true,
      });
      token = res.data.access_token;
      setAccessToken(token);
      console.log("Token refreshed successfully");
    } catch (err) {
      console.error("Token refresh failed:", err);
      clearAccessToken();
      // ✅ Optional: Redirect to login on refresh failure
      // window.location.href = "/login";
      return Promise.reject(err);
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


