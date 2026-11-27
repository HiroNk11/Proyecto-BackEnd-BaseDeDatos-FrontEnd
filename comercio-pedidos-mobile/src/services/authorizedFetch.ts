import { API_URL } from '../config/api';

type TokenProvider = () => string | null | Promise<string | null>;
let tokenProvider: TokenProvider = () => null;

/** Supply the access token from the identity client; no token is stored or logged. */
export function setAccessTokenProvider(provider: TokenProvider): void { tokenProvider = provider; }

export async function authorizedFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (url.startsWith(`${API_URL}/`)) {
    const token = await tokenProvider();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...init, headers });
}
