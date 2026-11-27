import { movementLabel } from "../lib/lifecycle";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  obtenerMovimientosStock,
  ajustarStock,
} from "../services/movimientoStockService";
import { obtenerProductos } from "../services/productoService";
import { useResource } from "../hooks/useResource";
import { errorMessage } from "../lib/problem";
import ResourceState from "../components/ui/ResourceState";
import Modal from "../components/ui/Modal";
import Toast from "../components/ui/Toast";

export default function MovimientosStock() {
  const [search, setSearch] = useSearchParams();
  const query = search.toString();
  const load = useCallback(() => {
    const p = new URLSearchParams(query);
    return obtenerMovimientosStock({
      pagina: Math.max(1, Number(p.get("pagina")) || 1),
      tamanioPagina: 10,
      productoId: Number(p.get("productoId")) || undefined,
      tipo: p.get("tipo") || undefined,
      fechaDesde: p.get("fechaDesde") || undefined,
      fechaHasta: p.get("fechaHasta") || undefined,
    });
  }, [query]);
  const movements = useResource(load);
  const products = useResource(obtenerProductos);
  const [type, setType] = useState<"Entrada" | "Salida" | null>(null);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function filter(key: string, value: string) {
    setSearch((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "pagina") next.delete("pagina");
      return next;
    });
  }
  function open(value: "Entrada" | "Salida") {
    setProduct("");
    setQuantity(1);
    setReason("");
    setError("");
    setType(value);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!type || lock.current) return;
    if (
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      reason.trim().length < 3
    ) {
      setError("Ingresá cantidad válida y motivo de al menos 3 caracteres.");
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await ajustarStock(Number(product), {
        tipoMovimiento: type === "Entrada" ? "Ingreso" : "AjusteManual",
        cantidad: type === "Entrada" ? quantity : -quantity,
        motivo: reason.trim(),
        version: products.data?.find((p) => p.id === Number(product))?.version,
      });
      setSuccess(`${type} registrada. Inventario actualizado.`);
      setType(null);
      movements.refresh();
      products.refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const page = Math.max(1, Number(search.get("pagina")) || 1);
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="section-eyebrow">TRAZABILIDAD DEL INVENTARIO</p>
          <h1>Movimientos de stock</h1>
          <p>Entradas, salidas y existencias después de cada operación.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => open("Entrada")}>
            Registrar entrada
          </button>
          <button className="btn btn-secondary" onClick={() => open("Salida")}>
            Registrar salida
          </button>
        </div>
      </div>
      <div className="filters-panel filters-grid">
        <label>
          Producto
          <select
            value={search.get("productoId") || ""}
            onChange={(e) => filter("productoId", e.target.value)}
          >
            <option value="">Todos los productos</option>
            {products.data?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tipo
          <select
            value={search.get("tipo") || ""}
            onChange={(e) => filter("tipo", e.target.value)}
          >
            <option value="">Todos</option>
            <option>Entrada</option>
            <option>Salida</option>
          </select>
        </label>
        <label>
          Desde
          <input
            type="date"
            value={search.get("fechaDesde") || ""}
            onChange={(e) => filter("fechaDesde", e.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={search.get("fechaHasta") || ""}
            onChange={(e) => filter("fechaHasta", e.target.value)}
          />
        </label>
        <button className="btn btn-secondary" onClick={() => setSearch({})}>
          Limpiar filtros
        </button>
      </div>
      {movements.loading || movements.error || !movements.data?.items.length ? (
        <ResourceState
          loading={movements.loading}
          error={movements.error}
          empty="Todavía no hay movimientos en esta vista"
          onRetry={movements.refresh}
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Stock anterior</th>
                <th>Stock posterior</th>
                <th>Motivo / responsable</th>
              </tr>
            </thead>
            <tbody>
              {movements.data.items.map((m) => (
                <tr key={m.id}>
                  <td>
                    {new Date(m.fechaUtc || m.fecha).toLocaleString("es-AR")}
                  </td>
                  <td>{m.nombreProducto}</td>
                  <td>
                    <span
                      className={`order-status ${m.tipo === "Entrada" ? "status-delivered" : "status-pending"}`}
                    >
                      {movementLabel(m.tipoMovimiento || m.tipo)}
                    </span>
                  </td>
                  <td>
                    {m.tipo === "Salida" ? "−" : "+"}
                    {m.cantidad}
                  </td>
                  <td>{m.stockAnterior}</td>
                  <td>
                    <strong>{m.stockPosterior}</strong>
                  </td>
                  <td>
                    {m.motivo || "—"}
                    <span className="cell-secondary">
                      {m.usuarioId || "Responsable no registrado"}
                      {m.pedidoId ? ` · Pedido #${m.pedidoId}` : ""}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          disabled={movements.loading || page <= 1}
          onClick={() => filter("pagina", String(page - 1))}
        >
          Anterior
        </button>
        <span>
          Página {page} de {Math.max(1, movements.data?.totalPaginas || 1)}
        </span>
        <button
          className="btn btn-secondary"
          disabled={
            movements.loading || page >= (movements.data?.totalPaginas || 1)
          }
          onClick={() => filter("pagina", String(page + 1))}
        >
          Siguiente
        </button>
      </div>
      {type && (
        <Modal
          title={`Registrar ${type.toLowerCase()} de stock`}
          busy={busy}
          onClose={() => setType(null)}
        >
          {products.loading || products.error ? (
            <ResourceState
              loading={products.loading}
              error={products.error}
              onRetry={products.refresh}
            />
          ) : (
            <form onSubmit={save} className="checkout-form">
              <label>
                Producto
                <select
                  required
                  value={product}
                  disabled={busy}
                  onChange={(e) => setProduct(e.target.value)}
                >
                  <option value="">Seleccioná un producto</option>
                  {products.data?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} · stock {p.stock}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Cantidad
                <input
                  type="number"
                  min="1"
                  max="2147483647"
                  required
                  disabled={busy}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </label>
              <label>
                Motivo
                <input
                  value={reason}
                  required
                  minLength={3}
                  maxLength={250}
                  disabled={busy}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              {error && (
                <div role="alert" className="error-message">
                  {error}
                </div>
              )}
              <button
                className="btn btn-primary"
                disabled={busy || !products.data?.length}
              >
                {busy && <span className="spinner" />}
                {busy ? "Registrando…" : `Registrar ${type.toLowerCase()}`}
              </button>
            </form>
          )}
        </Modal>
      )}
      {success && <Toast mensaje={success} onCerrar={() => setSuccess("")} />}
    </div>
  );
}
