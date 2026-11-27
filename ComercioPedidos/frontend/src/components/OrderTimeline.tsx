import { useCallback } from "react";
import { useResource } from "../hooks/useResource";
import { obtenerPedido } from "../services/pedidoService";
import StatusBadge from "./ui/StatusBadge";
import ResourceState from "./ui/ResourceState";
export default function OrderTimeline({ id }: { id: number }) {
  const load = useCallback(() => obtenerPedido(id), [id]);
  const data = useResource(load);
  return (
    <section aria-label="Historial de estados">
      <div className="list-caption">
        <h3>Historial de estados</h3>
        <button
          className="btn btn-secondary"
          disabled={data.loading}
          onClick={data.refresh}
        >
          Actualizar historial
        </button>
      </div>
      {data.loading || data.error ? (
        <ResourceState
          loading={data.loading}
          error={data.error}
          onRetry={data.refresh}
        />
      ) : (
        <ol className="order-timeline">
          {data.data?.historial?.length ? (
            data.data.historial.map((entry) => (
              <li key={entry.id}>
                <StatusBadge estado={entry.estadoNuevo} />
                <p>
                  {entry.estadoAnterior
                    ? `Desde ${entry.estadoAnterior === "EnPreparacion" ? "En preparación" : entry.estadoAnterior}`
                    : "Registro inicial / estado registrado"}{" "}
                  · {new Date(entry.fechaUtc).toLocaleString("es-AR")}
                </p>
                <small>Responsable: {entry.usuarioId}</small>
              </li>
            ))
          ) : (
            <li>No hay historial disponible para este pedido.</li>
          )}
        </ol>
      )}
    </section>
  );
}
