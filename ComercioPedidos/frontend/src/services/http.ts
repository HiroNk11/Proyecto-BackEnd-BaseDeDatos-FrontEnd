import axios from "axios";
import { parseProblem } from "../lib/problem";
import {
  getAccessToken,
  getSessionSnapshot,
  reportSession,
} from "../lib/session";
export { setAccessTokenProvider } from "../lib/session";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://localhost:7072/api"
).replace(/\/$/, "");
const revisions = new WeakMap<object, number>();
const http = axios.create({ timeout: 15000 });
http.interceptors.request.use(async (config) => {
  revisions.set(config, getSessionSnapshot().revision);
  const target = new URL(config.url || "", window.location.origin);
  const api = new URL(API_BASE_URL, window.location.origin);
  if (
    target.origin === api.origin &&
    target.pathname.startsWith(`${api.pathname}/`)
  ) {
    const token = await getAccessToken();
    if (token) config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});
http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response) {
      const status = error.response.status;
      reportSession(
        status,
        error.config ? (revisions.get(error.config) ?? -1) : -1,
      );
      return Promise.reject(parseProblem(status, error.response.data));
    }
    return Promise.reject(new TypeError("No se pudo conectar con la API."));
  },
);
export default http;
