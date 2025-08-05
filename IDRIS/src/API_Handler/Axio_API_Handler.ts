
import axios from "axios";
import { getAccessToken, setAccessToken, clearAccessToken } from "./token_store";

// Decode JWT payload
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

// Check if token is expired (with 30s buffer)
function isTokenExpired(token: string) {
  const payload = parseJwt(token);
  if (!payload?.exp) return true;

  const now = Math.floor(Date.now() / 1000);
  return payload.exp - 30 < now;
}

// Create Axios instance
export const API = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

// Map to hold ongoing requests (by URL key)
const abortControllerMap = new Map<string, AbortController>();

// Request interceptor: handle token and cancel logic
API.interceptors.request.use(async (config) => {
  const urlKey = `${config.method}:${config.url}`;

  // Cancel previous request if still ongoing
  if (abortControllerMap.has(urlKey)) {
    abortControllerMap.get(urlKey)?.abort();
  }

  const controller = new AbortController();
  config.signal = controller.signal;
  abortControllerMap.set(urlKey, controller);

  const skipRefresh =
    config.url?.includes("/login") || config.url?.includes("/register");

  let token = getAccessToken() ?? "";

  // Refresh if expired
  if (!skipRefresh && (token === "" || isTokenExpired(token))) {
    try {
      const res = await axios.post("http://localhost:8000/refresh", null, {
        withCredentials: true,
      });
      token = res.data.access_token;
      setAccessToken(token);
    } catch (err) {
      clearAccessToken();
      return Promise.reject(err);
    }
  }

  if (!skipRefresh && token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor: cleanup controller
API.interceptors.response.use(
  (res) => {
    const urlKey = `${res.config.method}:${res.config.url}`;
    abortControllerMap.delete(urlKey);
    return res;
  },
  (err) => {
    const urlKey = `${err.config?.method}:${err.config?.url}`;
    abortControllerMap.delete(urlKey);
    return Promise.reject(err);
  }
);

