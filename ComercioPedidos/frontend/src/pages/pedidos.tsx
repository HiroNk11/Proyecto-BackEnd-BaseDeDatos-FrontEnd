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

useEffect(() => {
  cargarClientes();
  cargarProductos();
}, []);

useEffect(() => {
  cargarPedidos();
}, [pagina, filtrosAplicados]);


  return (
  
    <div>
      <div>
  <select
    value={estado}
    onChange={(e) => setEstado(e.target.value)}
  >
    <option value="">Todos los estados</option>
    <option value="Pendiente">Pendiente</option>
    <option value="Confirmado">Confirmado</option>
    <option value="Cancelado">Cancelado</option>
    <option value="Entregado">Entregado</option>
  </select>

  <select
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

  <input
    type="date"
    value={fechaDesde}
    onChange={(e) => setFechaDesde(e.target.value)}
  />

  <input
    type="date"
    value={fechaHasta}
    onChange={(e) => setFechaHasta(e.target.value)}
  />
</div>
<button onClick={handleAplicarFiltros}>
  Aplicar filtros
</button>

<button onClick={handleLimpiarFiltros}>
  Limpiar filtros
</button>
<button onClick={() => setMostrarFormularioPedido(true)}>
  Nuevo pedido
</button>


{mostrarFormularioPedido && (
  <div>
    <h2>Nuevo pedido</h2>

    <label>Cliente</label>

    <select
      value={nuevoPedido.clienteId}
      onChange={(e) =>
        setNuevoPedido({
          ...nuevoPedido,
          clienteId: Number(e.target.value)
        })
      }
    >
      <option value={0}>Seleccione un cliente</option>

      {clientes.map((cliente) => (
        <option
          key={cliente.id}
          value={cliente.id}
        >
          {cliente.nombre} {cliente.apellido}
        </option>
      ))}
    </select>

    {nuevoPedido.detalles.map((detalle, indice) => (
      <div key={indice}>
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
          <option value={0}>Seleccione un producto</option>

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

        <label>Cantidad</label>
        <input
          type="number"
          min={1}
          value={detalle.cantidad}
          onChange={(e) =>
            actualizarDetalle(
              indice,
              "cantidad",
              Number(e.target.value)
            )
          }
        />

        {nuevoPedido.detalles.length > 1 && (
          <button
            type="button"
            onClick={() => quitarDetalle(indice)}
          >
            Quitar
          </button>
        )}
      </div>
    ))}

    <button
      type="button"
      onClick={agregarDetalle}
    >
      Agregar producto
    </button>
{errorPedido && (
  <p>
    {errorPedido}
  </p>
)}
    <button
      type="button"
      onClick={handleCrearPedido}
    >
      Guardar pedido
    </button>

    <button
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
    >Cancelar
    </button>
  </div>
)}

<h1>Lista de Pedidos</h1>

      <table>
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
            <td>{new Date(pedido.fecha).toLocaleString("es-AR")}</td>
              <td>{pedido.estado}</td>
              <td>${pedido.total}</td>
              <td>
<button
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
 <button
  onClick={() => setPagina(pagina - 1)}
  disabled={pagina === 1}
>
  Anterior
</button>

<span>
  Página {pagina} de {totalPaginas}
</span>

<button
  onClick={() => setPagina(pagina + 1)}
  disabled={pagina >= totalPaginas}
>
  Siguiente
</button>

  {pedidoSeleccionado && (
  <div>
    <h2>Pedido #{pedidoSeleccionado.id}</h2>

    <p>
      Cliente: {pedidoSeleccionado.nombreCliente}
    </p>

    <p>
      Estado: {pedidoSeleccionado.estado}
    </p>
{errorAccionPedido && (
  <p>
    {errorAccionPedido}
  </p>
)}
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Precio unitario</th>
          <th>Subtotal</th>
        </tr>
      </thead>

      <tbody>
        {pedidoSeleccionado.detalles.map((detalle) => (
          <tr key={detalle.productoId}>
            <td>{detalle.nombreProducto}</td>
            <td>{detalle.cantidad}</td>
            <td>${detalle.precioUnitario}</td>
            <td>${detalle.subtotal}</td>
          </tr>
        ))}
      </tbody>
      
    </table>
  {pedidoSeleccionado.estado === "Pendiente" && (
  <>
    <button
      onClick={() => handleConfirmarPedido(pedidoSeleccionado.id)}
    >
      Confirmar
    </button>

    <button
      onClick={() => handleCancelarPedido(pedidoSeleccionado.id)}
    >Cancelar
    </button>
  </>
)}

{pedidoSeleccionado.estado === "Confirmado" && (
  <>
    <button
      onClick={() => handleEntregarPedido(pedidoSeleccionado.id)}
    >
      Entregar
    </button>

    <button
      onClick={() => handleCancelarPedido(pedidoSeleccionado.id)}
    >
      Cancelar
    </button>
  </>
)}

    <p>
      <strong>Total: ${pedidoSeleccionado.total}</strong>
    </p>

    <button
  onClick={() => {
    setErrorAccionPedido("");
    setPedidoSeleccionado(null);
  }}
>
  Cerrar
</button>
  </div>
)}
</div>
    </div>
  );
}

export default Pedidos;