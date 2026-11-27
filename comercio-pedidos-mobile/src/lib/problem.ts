export interface ProblemDetails {
  title?: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
  mensaje?: string;
}
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string[]>;
  constructor(
    status: number,
    message: string,
    fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}
const labels: Record<string, string> = {
  nombre: "Nombre",
  apellido: "Apellido",
  email: "Email",
  telefono: "Teléfono",
  direccion: "Dirección",
  precio: "Precio",
  stock: "Stock",
  clienteid: "Cliente",
  productoid: "Producto",
  cantidad: "Cantidad",
  detalles: "Productos",
};
export function fieldLabel(key: string): string {
  const name =
    key
      .replace(/^\$\.?/, "")
      .split(".")
      .at(-1)
      ?.replace(/\[\d+\]/g, "")
      .toLowerCase() || "";
  return labels[name] || key;
}
export function parseProblem(status: number, body: unknown): ApiError {
  const data =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : {};
  const fields: Record<string, string[]> = {};
  if (
    typeof data.errors === "object" &&
    data.errors !== null &&
    !Array.isArray(data.errors)
  ) {
    for (const [key, value] of Object.entries(data.errors))
      if (Array.isArray(value))
        fields[key] = value
          .filter(
            (item): item is string =>
              typeof item === "string" && item.trim().length > 0,
          )
          .slice(0, 5);
  }
  const validation = Object.entries(fields)
    .flatMap(([key, messages]) =>
      messages.map((message) => `${fieldLabel(key)}: ${message}`),
    )
    .join("\n");
  const fallback =
    status === 401
      ? "Tu sesión es necesaria o expiró. Volvé a identificarte."
      : status === 403
        ? "Tu sesión no tiene permisos para esta operación. Solicitá acceso o utilizá otra cuenta."
        : status === 409
          ? "Los datos cambiaron o no hay stock suficiente. Actualizá antes de volver a intentar."
          : status === 429
            ? "Hay demasiadas solicitudes. Esperá un momento antes de reintentar."
            : status >= 500
              ? "El servicio no pudo completar la operación. Intentá nuevamente más tarde."
              : "No se pudo completar la solicitud.";
  const detail = [data.detail, data.mensaje, data.title].find(
    (value): value is string => typeof value === "string" && !!value.trim(),
  );
  return new ApiError(
    status,
    status === 401 || status === 403 || status >= 500
      ? fallback
      : validation || detail?.slice(0, 1200) || fallback,
    fields,
  );
}
export function errorMessage(
  error: unknown,
  fallback = "No se pudo completar la operación.",
): string {
  if (error instanceof ApiError) return error.message;
  if (
    error instanceof TypeError ||
    (error instanceof Error &&
      ["AbortError", "TimeoutError", "CanceledError"].includes(error.name))
  )
    return "No pudimos conectar con el servicio o se agotó el tiempo de espera. Revisá la conexión y reintentá.";
  return error instanceof Error ? error.message : fallback;
}
