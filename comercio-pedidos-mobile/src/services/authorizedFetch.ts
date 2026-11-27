import { API_URL } from "../config/api";
import { parseProblem } from "../lib/problem";
import {
  getAccessToken,
  getSessionSnapshot,
  reportSession,
} from "../lib/session";
export { setAccessTokenProvider } from "../lib/session";

export async function authorizedFetch(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const revision = getSessionSnapshot().revision;
  const headers = new Headers(init.headers);
  if (url.startsWith(`${API_URL}/`)) {
    const token = await getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 15000);
  try {
    const response = await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
    if (!response.ok) {
      reportSession(response.status, revision);
      let body: unknown;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      throw parseProblem(response.status, body);
    }
    return response;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
  }
}
