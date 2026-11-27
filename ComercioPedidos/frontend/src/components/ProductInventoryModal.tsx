import { useCallback, useRef, useState, type FormEvent } from "react";
import { useResource } from "../hooks/useResource";
import { obtenerProducto } from "../services/productoService";
import {
  ajustarStock,
  historialProducto,
} from "../services/movimientoStockService";
import { errorMessage } from "../lib/problem";
import { movementLabel } from "../lib/lifecycle";
import Modal from "./ui/Modal";
import ResourceState from "./ui/ResourceState";
export default function ProductInventoryModal({
  id,
  onClose,
  onSaved,
}: {
  id: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [page, setPage] = useState(1);
  const load = useCallback(() => historialProducto(id, page), [id, page]);
  const history = useResource(load);
  const loadProduct = useCallback(() => obtenerProducto(id), [id]);
  const product = useResource(loadProduct);
  const [type, setType] = useState<"Ingreso" | "AjusteManual">("Ingreso");
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function refresh() {
    product.refresh();
    history.refresh();
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !product.data) return;
    if (
      !Number.isInteger(quantity) ||
      quantity === 0 ||
      (type === "Ingreso" && quantity < 0) ||
      reason.trim().length < 3
    ) {
      setError(
        "Ingresá una cantidad válida y un motivo de al menos 3 caracteres.",
      );
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await ajustarStock(id, {
        tipoMovimiento: type,
        cantidad: quantity,
        motivo: reason.trim(),
        version: product.data.version,
      });
      setReason("");
      setQuantity(1);
      setPage(1);
      refresh();
      onSaved();
      setSuccess("Ajuste registrado con trazabilidad.");
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal title="Inventario e historial" busy={busy} onClose={onClose}>
      <p>
        {product.data?.nombre || `Producto #${id}`} · Stock actual:{" "}
        <strong>{product.data?.stock ?? "…"}</strong> · Mínimo:{" "}
        {product.data?.stockMinimo ?? 0}
      </p>
      <button
        className="btn btn-secondary"
        disabled={busy || product.loading || history.loading}
        onClick={refresh}
      >
        Actualizar datos
      </button>
      {success && (
        <p role="status" className="inventory-success">
          {success}
        </p>
      )}
      {error && (
        <div role="alert" className="error-message">
          {error} Actualizá los datos antes de reintentar.
        </div>
      )}
      {product.error && (
        <ResourceState error={product.error} onRetry={product.refresh} />
      )}
      <form className="checkout-form inventory-adjustment" onSubmit={save}>
        <h3>Ingreso o ajuste manual</h3>
        <fieldset disabled={busy || product.loading || !!product.error}>
          <label>
            Tipo de movimiento
            <select
              aria-label="Tipo de movimiento"
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
            >
              <option value="Ingreso">Ingreso de mercadería</option>
              <option value="AjusteManual">Ajuste manual (+ / −)</option>
            </select>
          </label>
          <label>
            Cantidad a sumar o restar
            <input
              aria-label="Cantidad a sumar o restar"
              type="number"
              step="1"
              required
              min={type === "Ingreso" ? 1 : -2147483647}
              max="2147483647"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>
          <label>
            Motivo obligatorio
            <input
              aria-label="Motivo obligatorio"
              required
              minLength={3}
              maxLength={250}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej.: ingreso de proveedor o unidades dañadas"
            />
          </label>
          <button className="btn btn-primary" disabled={!product.data || busy}>
            {busy && <span className="spinner" />}
            {busy ? "Registrando…" : "Registrar ajuste"}
          </button>
        </fieldset>
      </form>
      <h3>Movimientos auditados</h3>
      {history.loading || history.error || !history.data?.items.length ? (
        <ResourceState
          loading={history.loading}
          error={history.error}
          empty="Aún no hay movimientos"
          onRetry={history.refresh}
        />
      ) : (
        <ol className="inventory-history">
          {history.data.items.map((item) => (
            <li key={item.id}>
              <strong>
                {movementLabel(item.tipoMovimiento || item.tipo)} ·{" "}
                {item.tipo === "Entrada" ? "+" : "−"}
                {item.cantidad}
              </strong>
              <p>
                Stock {item.stockAnterior} →{" "}
                {item.stockNuevo ?? item.stockPosterior}
                {item.pedidoId ? ` · Pedido #${item.pedidoId}` : ""}
              </p>
              <p>{item.motivo}</p>
              <small>
                {new Date(item.fechaUtc || item.fecha).toLocaleString("es-AR")}{" "}
                · {item.usuarioId || "Responsable no registrado"}
              </small>
            </li>
          ))}
        </ol>
      )}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          disabled={busy || history.loading || page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </button>
        <span>
          Página {page} de {Math.max(1, history.data?.totalPaginas || 1)}
        </span>
        <button
          className="btn btn-secondary"
          disabled={
            busy || history.loading || page >= (history.data?.totalPaginas || 1)
          }
          onClick={() => setPage((p) => p + 1)}
        >
          Siguiente
        </button>
      </div>
    </Modal>
  );
}
