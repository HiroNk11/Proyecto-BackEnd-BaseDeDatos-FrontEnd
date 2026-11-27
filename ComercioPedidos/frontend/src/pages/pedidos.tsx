import { useCallback, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { Pedido, CrearPedido } from "../models/Pedido";
import { obtenerClientes } from "../services/clienteService";
import { obtenerProductos } from "../services/productoService";
import {
  obtenerPedidos,
  confirmarPedido,
  cancelarPedido,
  entregarPedido,
  crearPedido,
} from "../services/pedidoService";
import { useResource } from "../hooks/useResource";
import { errorMessage } from "../lib/problem";
import StatusBadge from "../components/ui/StatusBadge";
import ResourceState from "../components/ui/ResourceState";
import Modal from "../components/ui/Modal";
import ConfirmModal from "../components/ui/ConfirmModal";
import Toast from "../components/ui/Toast";

const states = ["Pendiente", "Confirmado", "Entregado", "Cancelado"];
const money = (value: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(
    value,
  );
type Action = "confirmar" | "entregar" | "cancelar";
const actions: Record<Action, (id: number) => Promise<void>> = {
  confirmar: confirmarPedido,
  entregar: entregarPedido,
  cancelar: cancelarPedido,
};
const initial: CrearPedido = {
  clienteId: 0,
  detalles: [{ productoId: 0, cantidad: 1 }],
};

export default function Pedidos() {
  const [params, setParams] = useSearchParams();
  const query = params.toString();
  const page = Math.max(1, Number(params.get("pagina")) || 1);
  const load = useCallback(() => {
    const search = new URLSearchParams(query);
    return obtenerPedidos({
      pagina: Math.max(1, Number(search.get("pagina")) || 1),
      tamanioPagina: 10,
      estado: states.includes(search.get("estado") || "")
        ? search.get("estado")!
        : undefined,
      clienteId:
        Number(search.get("clienteId")) > 0
          ? Number(search.get("clienteId"))
          : undefined,
      fechaDesde: search.get("fechaDesde") || undefined,
      fechaHasta: search.get("fechaHasta") || undefined,
    });
  }, [query]);
  const orders = useResource(load);
  const clients = useResource(obtenerClientes);
  const products = useResource(obtenerProductos);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<CrearPedido>(initial);
  const [intent, setIntent] = useState<{ id: number; action: Action } | null>(
    null,
  );
  const [processing, setProcessing] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  function filter(key: string, value: string) {
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "pagina") next.delete("pagina");
      return next;
    });
  }
  function openCreate() {
    setDraft({ clienteId: 0, detalles: [{ productoId: 0, cantidad: 1 }] });
    setError("");
    setCreating(true);
  }
  async function create(event: FormEvent) {
    event.preventDefault();
    if (lock.current) return;
    if (
      !draft.clienteId ||
      !draft.detalles.length ||
      draft.detalles.some(
        (d) => !d.productoId || !Number.isInteger(d.cantidad) || d.cantidad < 1,
      )
    ) {
      setError(
        "Seleccioná un cliente y al menos un producto con cantidad válida.",
      );
      return;
    }
    lock.current = true;
    setProcessing(true);
    setError("");
    try {
      await crearPedido(draft);
      setCreating(false);
      setSuccess("Pedido creado. El stock fue actualizado.");
      orders.refresh();
      products.refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setProcessing(false);
    }
  }
  async function execute() {
    if (!intent || lock.current) return;
    lock.current = true;
    setProcessing(true);
    setError("");
    try {
      await actions[intent.action](intent.id);
      setSuccess(`Pedido #${intent.id}: acción ${intent.action} completada.`);
      setSelected(null);
      orders.refresh();
      products.refresh();
    } catch (failure) {
      setError(errorMessage(failure));
    } finally {
      lock.current = false;
      setProcessing(false);
      setIntent(null);
    }
  }
  const estimate = draft.detalles.reduce(
    (total, item) =>
      total +
      (products.data?.find((p) => p.id === item.productoId)?.precio || 0) *
        item.cantidad,
    0,
  );
  const currentDate = new Date();
  const today = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
  return (
    <div className="orders-page">
      <div className="page-header">
        <div>
          <p className="section-eyebrow">OPERACIÓN COMERCIAL</p>
          <h1>Pedidos</h1>
          <p>Revisá cada operación y mantené su estado al día.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          Nuevo pedido
        </button>
      </div>
      {error && !creating && (
        <div role="alert" className="error-message">
          {error}
        </div>
      )}
      <div className="quick-filters" aria-label="Filtros rápidos">
        <button className="btn btn-secondary" onClick={() => setParams({})}>
          Todos
        </button>
        {["Pendiente", "Confirmado"].map((state) => (
          <button
            key={state}
            className={`btn ${params.get("estado") === state ? "btn-primary" : "btn-secondary"}`}
            onClick={() => filter("estado", state)}
          >
            {state === "Pendiente" ? "Pendientes" : "Confirmados"}
          </button>
        ))}
        <button
          className="btn btn-secondary"
          onClick={() =>
            setParams((previous) => {
              const next = new URLSearchParams(previous);
              next.set("fechaDesde", today);
              next.set("fechaHasta", today);
              next.delete("pagina");
              return next;
            })
          }
        >
          Hoy
        </button>
      </div>
      <div className="filters-grid filters-panel">
        <label>
          Estado
          <select
            value={params.get("estado") || ""}
            onChange={(event) => filter("estado", event.target.value)}
          >
            <option value="">Todos los estados</option>
            {states.map((state) => (
              <option key={state}>{state}</option>
            ))}
          </select>
        </label>
        <label>
          Cliente
          <select
            aria-label="Filtrar por cliente"
            value={params.get("clienteId") || ""}
            onChange={(event) => filter("clienteId", event.target.value)}
            disabled={!clients.data}
          >
            <option value="">Todos los clientes</option>
            {clients.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido}
              </option>
            ))}
          </select>
        </label>
        <label>
          Desde
          <input
            type="date"
            value={params.get("fechaDesde") || ""}
            onChange={(event) => filter("fechaDesde", event.target.value)}
          />
        </label>
        <label>
          Hasta
          <input
            type="date"
            value={params.get("fechaHasta") || ""}
            onChange={(event) => filter("fechaHasta", event.target.value)}
          />
        </label>
        <button className="btn btn-secondary" onClick={() => setParams({})}>
          Limpiar filtros
        </button>
      </div>
      <div className="list-caption">
        <span>
          {orders.loading
            ? "Consultando pedidos…"
            : `${orders.data?.totalRegistros || 0} operaciones encontradas`}
        </span>
        <button
          className="btn btn-secondary"
          disabled={orders.loading}
          onClick={orders.refresh}
        >
          Actualizar
        </button>
      </div>
      {orders.loading || orders.error || !orders.data?.items.length ? (
        <ResourceState
          loading={orders.loading}
          error={orders.error}
          empty="Aún no tenés pedidos en esta vista"
          onRetry={orders.refresh}
          onCreate={openCreate}
        />
      ) : (
        <div className="table-container">
          <table className="table responsive-orders">
            <thead>
              <tr>
                <th>Pedido / cliente</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {orders.data.items.map((order) => (
                <tr key={order.id}>
                  <td data-label="Pedido">
                    <strong>#{order.id}</strong>
                    <span className="cell-secondary">
                      {order.nombreCliente}
                    </span>
                  </td>
                  <td data-label="Fecha">
                    {new Date(order.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td data-label="Estado">
                    <StatusBadge estado={order.estado} />
                  </td>
                  <td data-label="Total">{money(order.total)}</td>
                  <td data-label="Acciones">
                    <button
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelected(order);
                        setError("");
                      }}
                    >
                      Ver detalle
                    </button>
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
          disabled={orders.loading || page <= 1}
          onClick={() => filter("pagina", String(page - 1))}
        >
          Anterior
        </button>
        <span>
          Página {page} de {Math.max(1, orders.data?.totalPaginas || 1)}
        </span>
        <button
          className="btn btn-secondary"
          disabled={orders.loading || page >= (orders.data?.totalPaginas || 1)}
          onClick={() => filter("pagina", String(page + 1))}
        >
          Siguiente
        </button>
      </div>
      {selected && !intent && (
        <Modal
          title={`Pedido #${selected.id}`}
          busy={processing}
          onClose={() => setSelected(null)}
        >
          {error && (
            <div role="alert" className="error-message">
              {error}
            </div>
          )}
          <div className="order-detail-meta">
            <div>
              <strong>{selected.nombreCliente}</strong>
              <p>{new Date(selected.fecha).toLocaleString("es-AR")}</p>
            </div>
            <StatusBadge estado={selected.estado} />
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Precio</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {selected.detalles.map((item, index) => (
                  <tr key={`${item.productoId}-${index}`}>
                    <td>{item.nombreProducto}</td>
                    <td>{item.cantidad}</td>
                    <td>{money(item.precioUnitario)}</td>
                    <td>{money(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="order-total">Total {money(selected.total)}</p>
          <div className="modal-actions">
            {selected.estado === "Pendiente" && (
              <button
                className="btn btn-primary"
                disabled={processing}
                onClick={() =>
                  setIntent({ id: selected.id, action: "confirmar" })
                }
              >
                Confirmar pedido
              </button>
            )}
            {selected.estado === "Confirmado" && (
              <button
                className="btn btn-primary"
                disabled={processing}
                onClick={() =>
                  setIntent({ id: selected.id, action: "entregar" })
                }
              >
                Marcar como entregado
              </button>
            )}
            {["Pendiente", "Confirmado"].includes(selected.estado) && (
              <button
                className="btn btn-danger"
                disabled={processing}
                onClick={() =>
                  setIntent({ id: selected.id, action: "cancelar" })
                }
              >
                Cancelar pedido
              </button>
            )}
          </div>
        </Modal>
      )}
      {intent && (
        <ConfirmModal
          titulo={`${intent.action === "cancelar" ? "Cancelar" : intent.action === "confirmar" ? "Confirmar" : "Entregar"} pedido #${intent.id}`}
          mensaje={
            intent.action === "cancelar"
              ? "Se devolverán las unidades al inventario. Esta operación no se puede deshacer."
              : "El estado se actualizará en el servidor. ¿Querés continuar?"
          }
          procesando={processing}
          onConfirmar={() => void execute()}
          onCancelar={() => setIntent(null)}
        />
      )}
      {creating && (
        <Modal
          title="Nuevo pedido"
          busy={processing}
          onClose={() => setCreating(false)}
        >
          {products.loading ||
          clients.loading ||
          products.error ||
          clients.error ? (
            <ResourceState
              loading={products.loading || clients.loading}
              error={products.error || clients.error}
              onRetry={() => {
                products.refresh();
                clients.refresh();
              }}
            />
          ) : (
            <form onSubmit={create} className="checkout-form">
              <label>
                Cliente
                <select
                  aria-label="Cliente"
                  required
                  value={draft.clienteId || ""}
                  disabled={processing}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      clienteId: Number(event.target.value),
                    })
                  }
                >
                  <option value="">Seleccioná un cliente</option>
                  {clients.data
                    ?.filter((c) => c.activo)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.apellido}
                      </option>
                    ))}
                </select>
              </label>
              <fieldset disabled={processing}>
                <legend>Productos del pedido</legend>
                {draft.detalles.map((item, index) => (
                  <div className="cart-line-editor" key={index}>
                    <label>
                      Producto
                      <select
                        aria-label="Producto"
                        required
                        value={item.productoId || ""}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            detalles: draft.detalles.map((line, i) =>
                              i === index
                                ? {
                                    ...line,
                                    productoId: Number(event.target.value),
                                  }
                                : line,
                            ),
                          })
                        }
                      >
                        <option value="">Seleccioná un producto</option>
                        {products.data
                          ?.filter((p) => p.activo && p.stock > 0)
                          .map((p) => (
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
                        required
                        min="1"
                        max={
                          products.data?.find((p) => p.id === item.productoId)
                            ?.stock || 2147483647
                        }
                        value={item.cantidad}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            detalles: draft.detalles.map((line, i) =>
                              i === index
                                ? {
                                    ...line,
                                    cantidad: Number(event.target.value),
                                  }
                                : line,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      aria-label={`Quitar producto ${index + 1}`}
                      disabled={draft.detalles.length === 1}
                      onClick={() =>
                        setDraft({
                          ...draft,
                          detalles: draft.detalles.filter(
                            (_, i) => i !== index,
                          ),
                        })
                      }
                    >
                      Quitar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={draft.detalles.length >= 100}
                  onClick={() =>
                    setDraft({
                      ...draft,
                      detalles: [
                        ...draft.detalles,
                        { productoId: 0, cantidad: 1 },
                      ],
                    })
                  }
                >
                  Agregar producto
                </button>
              </fieldset>
              {error && (
                <div role="alert" className="error-message">
                  {error}
                </div>
              )}
              <div className="checkout-summary">
                <div>
                  <small>Total estimado · confirmado por la API</small>
                  <strong>{money(estimate)}</strong>
                </div>
                <button
                  className="btn btn-primary"
                  disabled={
                    processing ||
                    !clients.data?.length ||
                    !products.data?.length
                  }
                >
                  {processing && <span className="spinner" />}
                  {processing ? "Creando pedido…" : "Crear pedido"}
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
      {success && <Toast mensaje={success} onCerrar={() => setSuccess("")} />}
    </div>
  );
}
