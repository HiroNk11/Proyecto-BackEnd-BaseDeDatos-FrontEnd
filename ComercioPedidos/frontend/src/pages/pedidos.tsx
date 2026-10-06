import { useEffect, useState } from "react";
import type { Cliente } from "../models/Cliente";
import { obtenerClientes } from "../services/clienteService";
import {
  obtenerPedidos,
  confirmarPedido,
  entregarPedido,
  cancelarPedido,
  crearPedido
} from "../services/pedidoService";
import type { Producto } from "../models/Producto";
import { obtenerProductos } from "../services/productoService";
import type {
  Pedido,
  CrearPedido
} from "../models/Pedido";
import axios from "axios";

function Pedidos() {
const [errorPedido, setErrorPedido] = useState("");
const [mostrarFormularioPedido, setMostrarFormularioPedido] = useState(false);
const [productos, setProductos] = useState<Producto[]>([]);
const [pedidos, setPedidos] = useState<Pedido[]>([]);
const [pagina, setPagina] = useState(1);
const [totalPaginas, setTotalPaginas] = useState(1);
const [estado, setEstado] = useState("");
const [clienteId, setClienteId] = useState("");
const [fechaDesde, setFechaDesde] = useState("");
const [fechaHasta, setFechaHasta] = useState("");
const [clientes, setClientes] = useState<Cliente[]>([]);
const [filtrosAplicados, setFiltrosAplicados] = useState({
  estado: "",
  clienteId: "",
  fechaDesde: "",
  fechaHasta: ""
});

const [nuevoPedido, setNuevoPedido] = useState<CrearPedido>({
  clienteId: 0,
  detalles: [
    {
      productoId: 0,
      cantidad: 1
    }
  ]
});
const obtenerMensajeError = (
  error: unknown,
  mensajePorDefecto: string
) => {
  if (axios.isAxiosError<{ mensaje?: string }>(error)) {
    return (
      error.response?.data?.mensaje ??
      mensajePorDefecto
    );
  }

  return mensajePorDefecto;
};

const handleCrearPedido = async () => {
  setErrorPedido("");

  if (nuevoPedido.clienteId === 0) {
    setErrorPedido("Debe seleccionar un cliente.");
    return;
  }

  const detalleInvalido = nuevoPedido.detalles.some(
    (detalle) =>
      detalle.productoId === 0 ||
      detalle.cantidad <= 0
  );

  if (detalleInvalido) {
    setErrorPedido(
      "Todos los productos deben estar seleccionados y tener una cantidad mayor que cero."
    );
    return;
  }
  const detalleSinStock = nuevoPedido.detalles.find(
  (detalle) => {
    const producto = productos.find(
      (producto) =>
        producto.id === detalle.productoId
    );

    return (
      producto &&
      detalle.cantidad > producto.stock
    );
  }
);

if (detalleSinStock) {
  const producto = productos.find(
    (producto) =>
      producto.id === detalleSinStock.productoId
  );

  setErrorPedido(
    `La cantidad solicitada de ${producto?.nombre} supera el stock disponible (${producto?.stock}).`
  );

  return;
}

  try {
    await crearPedido(nuevoPedido);

    setMostrarFormularioPedido(false);

    setNuevoPedido({
      clienteId: 0,
      detalles: [
        {
          productoId: 0,
          cantidad: 1
        }
      ]
    });

    setErrorPedido("");

    await cargarProductos();

    if (pagina === 1) {
      await cargarPedidos();
    } else {
      setPagina(1);
    }

  } catch (error) {
  console.error("Error al crear el pedido:", error);

  setErrorPedido(
    obtenerMensajeError(
      error,
      "No se pudo crear el pedido."
    )
  );
}
};
const [errorAccionPedido, setErrorAccionPedido] = useState("");
const [pedidoSeleccionado, setPedidoSeleccionado] =
  useState<Pedido | null>(null);

const cargarProductos = async () => {
  try {
    const productosData = await obtenerProductos();
    setProductos(productosData);
  } catch (error) {
    console.error("Error al obtener los productos:", error);
  }
};

const cargarPedidos = async () => {
  try {
    const respuesta = await obtenerPedidos({
      pagina,
      tamanioPagina: 3,

      estado:
        filtrosAplicados.estado || undefined,

      clienteId:
        filtrosAplicados.clienteId
          ? Number(filtrosAplicados.clienteId)
          : undefined,

      fechaDesde:
        filtrosAplicados.fechaDesde || undefined,

      fechaHasta:
        filtrosAplicados.fechaHasta || undefined
    });

    setPedidos(respuesta.items);
    setTotalPaginas(respuesta.totalPaginas);

  } catch (error) {
    console.error("Error al obtener los pedidos:", error);
  }
};

const cargarClientes = async () => {
  try {
    const clientesData = await obtenerClientes();
    setClientes(clientesData);
  } catch (error) {
    console.error("Error al obtener los clientes:", error);
  }
};

const handleAplicarFiltros = () => {
  setPagina(1);

  setFiltrosAplicados({
    estado,
    clienteId,
    fechaDesde,
    fechaHasta
  });
};

const handleLimpiarFiltros = () => {
  setEstado("");
  setClienteId("");
  setFechaDesde("");
  setFechaHasta("");

  setPagina(1);

  setFiltrosAplicados({
    estado: "",
    clienteId: "",
    fechaDesde: "",
    fechaHasta: ""
  });
};

const handleConfirmarPedido = async (id: number) => {
  setErrorAccionPedido("");

  try {
    await confirmarPedido(id);
    await cargarPedidos();
    setPedidoSeleccionado(null);
  } catch (error) {
    console.error("Error al confirmar el pedido:", error);

    setErrorAccionPedido(
      obtenerMensajeError(
        error,
        "No se pudo confirmar el pedido."
      )
    );
  }
};

const handleEntregarPedido = async (id: number) => {
  setErrorAccionPedido("");

  try {
    await entregarPedido(id);
    await cargarPedidos();
    setPedidoSeleccionado(null);
  } catch (error) {
    console.error("Error al entregar el pedido:", error);

    setErrorAccionPedido(
      obtenerMensajeError(
        error,
        "No se pudo entregar el pedido."
      )
    );
  }
};

const handleCancelarPedido = async (id: number) => {
  const confirmar = window.confirm(
    "¿Estás seguro de que querés cancelar este pedido?"
  );

  if (!confirmar) {
    return;
  }

  setErrorAccionPedido("");

  try {
    await cancelarPedido(id);

    await cargarPedidos();
    await cargarProductos();

    setPedidoSeleccionado(null);
  } catch (error) {
    console.error("Error al cancelar el pedido:", error);

    setErrorAccionPedido(
      obtenerMensajeError(
        error,
        "No se pudo cancelar el pedido."
      )
    );
  }
};

const actualizarDetalle = (
  indice: number,
  campo: "productoId" | "cantidad",
  valor: number
) => {
  const nuevosDetalles = [...nuevoPedido.detalles];

  nuevosDetalles[indice] = {
    ...nuevosDetalles[indice],
    [campo]: valor
  };

  setNuevoPedido({
    ...nuevoPedido,
    detalles: nuevosDetalles
  });
};

const agregarDetalle = () => {
  setNuevoPedido({
    ...nuevoPedido,
    detalles: [
      ...nuevoPedido.detalles,
      {
        productoId: 0,
        cantidad: 1
      }
    ]
  });
};

const quitarDetalle = (indice: number) => {
  const nuevosDetalles = nuevoPedido.detalles.filter(
    (_, i) => i !== indice
  );

  setNuevoPedido({
    ...nuevoPedido,
    detalles: nuevosDetalles
  });
};
const totalEstimado = nuevoPedido.detalles.reduce(
  (total, detalle) => {
    const producto = productos.find(
      (producto) => producto.id === detalle.productoId
    );

    if (!producto) {
      return total;
    }

    return total + producto.precio * detalle.cantidad;
  },
  0
);

useEffect(() => {
  cargarClientes();
  cargarProductos();
  cargarPedidos();
}, [pagina, filtrosAplicados]);




return (
  <div>
    <div className="page-header">
      <div>
        <h1>Pedidos</h1>
        <p>Gestioná y consultá los pedidos registrados</p>
      </div>

      <button
        className="btn btn-primary"
        onClick={() => {
          setErrorPedido("");
          setMostrarFormularioPedido(true);
        }}
      >
        Nuevo pedido
      </button>
    </div>


    <div className="filters-card">

      <div className="filters-grid">

        <div className="form-group">
          <label htmlFor="filtro-estado">
            Estado
          </label>

          <select
            id="filtro-estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmado">Confirmado</option>
            <option value="Cancelado">Cancelado</option>
            <option value="Entregado">Entregado</option>
          </select>
        </div>


        <div className="form-group">
          <label htmlFor="filtro-cliente">
            Cliente
          </label>

          <select
            id="filtro-cliente"
            value={clienteId}
            onChange={(e) => setClienteId(e.target.value)}
          >
            <option value="">Todos los clientes</option>

            {clientes.map((cliente) => (
              <option
                key={cliente.id}
                value={cliente.id}
              >
                {cliente.nombre} {cliente.apellido}
              </option>
            ))}
          </select>
        </div>


        <div className="form-group">
          <label htmlFor="fecha-desde">
            Desde
          </label>

          <input
            id="fecha-desde"
            type="date"
            value={fechaDesde}
            onChange={(e) =>
              setFechaDesde(e.target.value)
            }
          />
        </div>


        <div className="form-group">
          <label htmlFor="fecha-hasta">
            Hasta
          </label>

          <input
            id="fecha-hasta"
            type="date"
            value={fechaHasta}
            onChange={(e) =>
              setFechaHasta(e.target.value)
            }
          />
        </div>

      </div>


      <div className="filters-actions">

        <button
          className="btn btn-primary"
          onClick={handleAplicarFiltros}
        >
          Aplicar filtros
        </button>

        <button
          className="btn btn-secondary"
          onClick={handleLimpiarFiltros}
        >
          Limpiar
        </button>

      </div>

    </div>


    {mostrarFormularioPedido && (
  <div className="modal-overlay">

    <div className="modal order-form-modal">

      <div className="order-form-content">

        <h2>Nuevo pedido</h2>

        <div className="form-group">
          <label htmlFor="pedido-cliente">
            Cliente
          </label>

          <select
            id="pedido-cliente"
            value={nuevoPedido.clienteId}
            onChange={(e) =>
              setNuevoPedido({
                ...nuevoPedido,
                clienteId: Number(e.target.value)
              })
            }
          >
            <option value={0}>
              Seleccione un cliente
            </option>

            {clientes.map((cliente) => (
              <option
                key={cliente.id}
                value={cliente.id}
              >
                {cliente.nombre} {cliente.apellido}
              </option>
            ))}
          </select>
        </div>


   {nuevoPedido.detalles.map(
  (detalle, indice) => {
    const productoSeleccionado = productos.find(
      (producto) =>
        producto.id === detalle.productoId
    );

    const subtotal = productoSeleccionado
      ? productoSeleccionado.precio *
        detalle.cantidad
      : 0;

    return (
      <div
        key={indice}
        className="order-item-row"
      >

  <div className="form-group order-product">
    <label>Producto</label>

    <select
      value={detalle.productoId}
      onChange={(e) =>
        actualizarDetalle(
          indice,
          "productoId",
          Number(e.target.value)
        )
      }
    >
      <option value={0}>
        Seleccione un producto
      </option>

      {productos
        .filter((producto) => producto.activo)
        .map((producto) => (
          <option
            key={producto.id}
            value={producto.id}
          >
            {producto.nombre} - Stock: {producto.stock}
          </option>
        ))}
    </select>
  </div>

 <div className="form-group order-quantity">
  <label>Cantidad</label>

  <input
    type="number"
    min={1}
    max={productoSeleccionado?.stock}
    value={detalle.cantidad}
    onChange={(e) =>
      actualizarDetalle(
        indice,
        "cantidad",
        Number(e.target.value)
      )
    }
  />

  {productoSeleccionado && (
    <small className="stock-helper">
      Disponible: {productoSeleccionado.stock}
    </small>
  )}
</div>
<div className="order-line-subtotal">
  <span>Subtotal</span>

  <strong>
    {subtotal.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS"
    })}
  </strong>
</div>
  {nuevoPedido.detalles.length > 1 && (
    <button
      className="btn btn-danger order-remove"
      type="button"
      onClick={() => quitarDetalle(indice)}
    >
      Quitar
    </button>
  )}
</div>
          
    );
  }
)}
<div className="add-product-row">
  <button
    className="btn btn-add-product"
    type="button"
    onClick={agregarDetalle}
  >
    + Agregar otro producto
  </button>
</div>
<div className="order-preview-total">
  <span>Total estimado</span>

  <strong>
    {totalEstimado.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS"
    })}
  </strong>
</div>

       {errorPedido && (
  <div className="error-message">
    {errorPedido}
  </div>
)}


        
              <div className="order-form-actions">

  <button
    className="btn btn-primary"
    type="button"
    onClick={handleCrearPedido}
  >
    Guardar pedido
  </button>

  <button
    className="btn btn-secondary"
    type="button"
    onClick={() => {
      setMostrarFormularioPedido(false);
      setErrorPedido("");

      setNuevoPedido({
        clienteId: 0,
        detalles: [
          {
            productoId: 0,
            cantidad: 1
          }
        ]
      });
    }}
  >
    Cancelar
  </button>

</div>

      </div>

    </div>

  </div>
    )}


    <div className="table-card">
  <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>

<tbody>
  {pedidos.map((pedido) => (
    <tr key={pedido.id}>

      <td>{pedido.id}</td>

      <td>{pedido.nombreCliente}</td>

      <td>
        {new Date(pedido.fecha).toLocaleString("es-AR")}
      </td>

      <td>
        <span
          className={`order-status order-status-${pedido.estado.toLowerCase()}`}
        >
          {pedido.estado}
        </span>
      </td>

      <td>
        {pedido.total.toLocaleString("es-AR", {
          style: "currency",
          currency: "ARS"
        })}
      </td>

      <td>
        <button
          className="btn btn-edit"
          onClick={() => {
            setErrorAccionPedido("");
            setPedidoSeleccionado(pedido);
          }}
        >
          Ver detalle
        </button>
      </td>

    </tr>
  ))}
</tbody>
      </table>
      <div>
<div className="pagination">
  <button
    className="btn btn-secondary"
    onClick={() => setPagina(pagina - 1)}
    disabled={pagina === 1}
  >
    Anterior
  </button>

  <span className="pagination-info">
    Página <strong>{pagina}</strong> de{" "}
    <strong>{totalPaginas}</strong>
  </span>

  <button
    className="btn btn-secondary"
    onClick={() => setPagina(pagina + 1)}
    disabled={pagina >= totalPaginas}
  >
    Siguiente
  </button>
</div>

{pedidoSeleccionado && (
  <div className="modal-overlay">

    <div className="modal order-detail-modal">

      <div className="order-detail-content">

        <div className="order-detail-header">
          <div>
            <h2>
              Pedido #{pedidoSeleccionado.id}
            </h2>

            <p>
              {pedidoSeleccionado.nombreCliente}
            </p>
          </div>

          <span
            className={`order-status order-status-${pedidoSeleccionado.estado.toLowerCase()}`}
          >
            {pedidoSeleccionado.estado}
          </span>
        </div>


        {errorAccionPedido && (
          <div className="error-message">
            {errorAccionPedido}
          </div>
        )}


        <div className="order-detail-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio unitario</th>
                <th>Subtotal</th>
              </tr>
            </thead>

            <tbody>
              {pedidoSeleccionado.detalles.map(
                (detalle) => (
                  <tr key={detalle.productoId}>
                    <td>
                      {detalle.nombreProducto}
                    </td>

                    <td>
                      {detalle.cantidad}
                    </td>

                    <td>
                      {detalle.precioUnitario.toLocaleString(
                        "es-AR",
                        {
                          style: "currency",
                          currency: "ARS"
                        }
                      )}
                    </td>

                    <td>
                      {detalle.subtotal.toLocaleString(
                        "es-AR",
                        {
                          style: "currency",
                          currency: "ARS"
                        }
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>


        <div className="order-total">
          <span>Total</span>

          <strong>
            {pedidoSeleccionado.total.toLocaleString(
              "es-AR",
              {
                style: "currency",
                currency: "ARS"
              }
            )}
          </strong>
        </div>


        <div className="modal-actions">

          {pedidoSeleccionado.estado === "Pendiente" && (
            <>
              <button
                className="btn btn-primary"
                onClick={() =>
                  handleConfirmarPedido(
                    pedidoSeleccionado.id
                  )
                }
              >
                Confirmar
              </button>

              <button
                className="btn btn-danger"
                onClick={() =>
                  handleCancelarPedido(
                    pedidoSeleccionado.id
                  )
                }
              >
                Cancelar pedido
              </button>
            </>
          )}


          {pedidoSeleccionado.estado === "Confirmado" && (
            <>
              <button
                className="btn btn-primary"
                onClick={() =>
                  handleEntregarPedido(
                    pedidoSeleccionado.id
                  )
                }
              >
                Marcar como entregado
              </button>

              <button
                className="btn btn-danger"
                onClick={() =>
                  handleCancelarPedido(
                    pedidoSeleccionado.id
                  )
                }
              >
                Cancelar pedido
              </button>
            </>
          )}


          <button
            className="btn btn-secondary"
            onClick={() => {
              setErrorAccionPedido("");
              setPedidoSeleccionado(null);
            }}
          >
            Cerrar
          </button>

        </div>

      </div>

    </div>

  </div>
)}
       </div>

    </div>

  </div>
);
}

export default Pedidos;