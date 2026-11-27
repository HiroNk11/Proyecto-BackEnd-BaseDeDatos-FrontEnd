import axios from 'axios';

export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'https://localhost:7072/api').replace(/\/$/, '');
type TokenProvider = () => string | null | Promise<string | null>;
let tokenProvider: TokenProvider = () => null;

/** Connect to an OIDC client or an in-memory local-development token. Never persist tokens here. */
export function setAccessTokenProvider(provider: TokenProvider): void { tokenProvider = provider; }

const http = axios.create();
http.interceptors.request.use(async config => {
  const target = new URL(config.url || '', window.location.origin);
  const api = new URL(API_BASE_URL, window.location.origin);
  if (target.origin === api.origin && target.pathname.startsWith(`${api.pathname}/`)) {
    const token = await tokenProvider();
    if (token) config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});
export default http;
