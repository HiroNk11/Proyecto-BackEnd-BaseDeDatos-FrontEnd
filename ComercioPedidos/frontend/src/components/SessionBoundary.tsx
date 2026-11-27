import {
  useState,
  useSyncExternalStore,
  type ReactNode,
  type FormEvent,
} from "react";
import {
  clearSession,
  dismissSessionNotice,
  getSessionSnapshot,
  setDevelopmentToken,
  subscribeSession,
} from "../lib/session";

export default function SessionBoundary({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribeSession, getSessionSnapshot);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  function connect(event: FormEvent) {
    event.preventDefault();
    if (!setDevelopmentToken(token)) {
      setError(
        "Ingresá un JWT con sus tres segmentos. La API validará firma, permisos y vencimiento.",
      );
      return;
    }
    setToken("");
    setError("");
    setOpen(false);
  }
  const form = import.meta.env.DEV && (
    <details
      open={open || session.status === 401}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="development-session"
    >
      <summary>Acceso de desarrollo</summary>
      <p>
        JWT temporal generado con dotnet user-jwts. Se conserva solo en memoria;
        no se guarda ni se registra.
      </p>
      <form onSubmit={connect}>
        <label htmlFor="access-token">Access token</label>
        <input
          id="access-token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          required
        />
        <button className="btn btn-primary">Usar token y recargar datos</button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            clearSession();
            setToken("");
          }}
        >
          Borrar sesión local
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </details>
  );
  return (
    <>
      <div className="session-toolbar">{form}</div>
      {session.status && (
        <section
          className={`session-notice session-${session.status}`}
          role="alert"
        >
          <div>
            <strong>
              {session.status === 401
                ? "Sesión requerida o expirada"
                : "Acceso restringido"}
            </strong>
            <p>
              {session.status === 401
                ? "Identificate para continuar. Si estás desarrollando, ingresá un token válido arriba."
                : "Tu cuenta no tiene permisos para esta operación. Podés seguir usando las funciones autorizadas."}
            </p>
          </div>
          {session.status === 403 && (
            <button
              className="btn btn-secondary"
              onClick={dismissSessionNotice}
            >
              Ocultar aviso
            </button>
          )}
        </section>
      )}
      {session.status !== 401 && <div key={session.revision}>{children}</div>}
    </>
  );
}
