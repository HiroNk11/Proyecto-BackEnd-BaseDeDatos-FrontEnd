export type TokenProvider = () => string | null | Promise<string | null>;
type Snapshot = { status: 401 | 403 | null; revision: number };
let snapshot: Snapshot = { status: null, revision: 0 };
let provider: TokenProvider = () => null;
const listeners = new Set<() => void>();
const publish = (next: Snapshot) => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};
export const getSessionSnapshot = (): Snapshot => snapshot;
export const subscribeSession = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export async function getAccessToken(): Promise<string | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      Promise.resolve().then(() => provider()),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new TypeError(
                "No se pudo obtener la sesi�n. Volv� a identificarte.",
              ),
            ),
          10000,
        );
      }),
    ]);
  } catch {
    throw new TypeError("No se pudo obtener la sesi�n. Volv� a identificarte.");
  } finally {
    clearTimeout(timer);
  }
}
export function setAccessTokenProvider(next: TokenProvider): void {
  provider = next;
  publish({ status: null, revision: snapshot.revision + 1 });
}
export function reportSession(status: number, revision: number): void {
  if (
    revision === snapshot.revision &&
    (status === 401 || status === 403) &&
    snapshot.status !== status &&
    !(snapshot.status === 401 && status === 403)
  )
    publish({ ...snapshot, status });
}
export function dismissSessionNotice(): void {
  if (snapshot.status === 403) publish({ ...snapshot, status: null });
}
export function clearSession(): void {
  setAccessTokenProvider(() => null);
}
export function setDevelopmentToken(value: string): boolean {
  const token = value.trim();
  if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))
    return false;
  setAccessTokenProvider(() => token);
  return true;
}
