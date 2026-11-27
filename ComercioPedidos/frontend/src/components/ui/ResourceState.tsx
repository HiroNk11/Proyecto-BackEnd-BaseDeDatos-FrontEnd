export default function ResourceState({
  loading,
  error,
  empty,
  onRetry,
  onCreate,
}: {
  loading?: boolean;
  error?: string;
  empty?: string;
  onRetry?: () => void;
  onCreate?: () => void;
}) {
  if (loading)
    return (
      <div role="status" className="resource-state">
        <span className="spinner" aria-hidden="true" />
        Cargando datos…
      </div>
    );
  if (error)
    return (
      <div role="alert" className="error-message resource-state">
        <p>{error}</p>
        {onRetry && (
          <button className="btn btn-secondary" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    );
  return (
    <div className="resource-state">
      <h3>{empty || "No hay resultados"}</h3>
      <p>Probá con otros filtros o registrá la primera operación.</p>
      {onCreate && (
        <button className="btn btn-primary" onClick={onCreate}>
          Crear pedido
        </button>
      )}
    </div>
  );
}
