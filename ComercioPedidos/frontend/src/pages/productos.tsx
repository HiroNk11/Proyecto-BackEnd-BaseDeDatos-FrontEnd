import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import type {
  Producto,
  CrearProducto
} from "../models/Producto";

import {
  obtenerProductos,
  crearProducto,
  eliminarProducto,
  actualizarProducto
} from "../services/productoService";

import { useSearchParams } from "react-router-dom";
import ConfirmModal from "../components/ui/ConfirmModal";

const productoInicial: CrearProducto = {
  nombre: "",
  descripcion: "",
  precio: 0,
  stock: 0,
  activo: true
};

function Productos() {
  const [searchParams] = useSearchParams();

  const estadoDesdeUrl =
    searchParams.get("estado") ?? "";

  const [productoAEliminar, setProductoAEliminar] =
    useState<Producto | null>(null);

  const [eliminando, setEliminando] =
    useState(false);
  
  const [productos, setProductos] =
    useState<Producto[]>([]);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [nuevoProducto, setNuevoProducto] =
    useState<CrearProducto>(productoInicial);

  const [productoEditandoId, setProductoEditandoId] =
    useState<number | null>(null);

  const [busqueda, setBusqueda] =
    useState("");

  const [filtroEstado, setFiltroEstado] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =========================
     CARGAR PRODUCTOS
  ========================= */

  const cargarProductos = async () => {

    try {

      setCargando(true);

      const productosData =
        await obtenerProductos();

      setProductos(productosData);

    } catch (error) {

      console.error(
        "Error al obtener los productos:",
        error
      );

      setError(
        "No se pudieron cargar los productos."
      );

    } finally {

      setCargando(false);
    }
  };


  /* =========================
     ABRIR FORMULARIO NUEVO
  ========================= */

  const handleNuevoProducto = () => {

    setNuevoProducto(productoInicial);

    setProductoEditandoId(null);

    setError("");

    setMostrarFormulario(true);
  };


  /* =========================
     ABRIR FORMULARIO EDICIÓN
  ========================= */

  const handleEditar = (
    producto: Producto
  ) => {

    setNuevoProducto({
      nombre: producto.nombre,
      descripcion: producto.descripcion ?? "",
      precio: producto.precio,
      stock: producto.stock,
      activo: producto.activo
    });

    setProductoEditandoId(producto.id);

    setError("");

    setMostrarFormulario(true);
  };


  /* =========================
     CERRAR FORMULARIO
  ========================= */

  const cerrarFormulario = () => {

    setMostrarFormulario(false);

    setProductoEditandoId(null);

    setNuevoProducto(productoInicial);

    setError("");
  };


  /* =========================
     GUARDAR / ACTUALIZAR
  ========================= */

  const handleSubmit = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    try {

      setGuardando(true);

      setError("");

      if (productoEditandoId === null) {

        await crearProducto(
          nuevoProducto
        );

      } else {

        await actualizarProducto(
          productoEditandoId,
          nuevoProducto
        );
      }

      await cargarProductos();

      cerrarFormulario();

    } catch (error) {

      console.error(
        "Error al guardar el producto:",
        error
      );

      setError(
        "No se pudo guardar el producto. Revisá los datos e intentá nuevamente."
      );

    } finally {

      setGuardando(false);
    }
  };


  /* =========================
     ELIMINAR PRODUCTO
  ========================= */

  const handleEliminar = async () => {

    if (!productoAEliminar) {
      return;
    }

    try {

      setEliminando(true);
      setError("");

      await eliminarProducto(
        productoAEliminar.id
      );

      await cargarProductos();

      setProductoAEliminar(null);

    } catch (error) {

      console.error(
        "Error al eliminar el producto:",
        error
      );

      setError(
        "No se pudo eliminar el producto."
      );

    } finally {

      setEliminando(false);
    }
  };


  /* =========================
     ESTADO DEL STOCK
  ========================= */

  const obtenerEstadoStock = (
    stock: number
  ) => {

    if (stock === 0) {

      return {
        texto: "Sin stock",
        clase: "stock-badge stock-out"
      };
    }

    if (stock <= 5) {

      return {
        texto: "Stock bajo",
        clase: "stock-badge stock-low"
      };
    }

    return {
      texto: "Disponible",
      clase: "stock-badge stock-ok"
    };
  };


  /* =========================
     FILTROS
  ========================= */

  const productosFiltrados =
    productos.filter((producto) => {

      const coincideBusqueda =
        producto.nombre
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          ) ||

        (producto.descripcion ?? "")
          .toLowerCase()
          .includes(
            busqueda.toLowerCase()
          );


      const coincideEstado =
  filtroEstado === "" ||

  (
    filtroEstado === "disponible" &&
    producto.activo &&
    producto.stock > 0
  ) ||

  (
    filtroEstado === "activo" &&
    producto.activo
  ) ||

  (
    filtroEstado === "inactivo" &&
    !producto.activo
  ) ||

  (
    filtroEstado === "stock-bajo" &&
    producto.activo &&
    producto.stock > 0 &&
    producto.stock <= 5
  ) ||

  (
    filtroEstado === "sin-stock" &&
    producto.stock === 0
  );


      return (
        coincideBusqueda &&
        coincideEstado
      );
    });


  /* =========================
     CARGA INICIAL
  ========================= */

  useEffect(() => {

    cargarProductos();

  }, []);

  useEffect(() => {

  const estadosPermitidos = [
  "disponible",
  "activo",
  "inactivo",
  "stock-bajo",
  "sin-stock"
];

  if (
    estadosPermitidos.includes(
      estadoDesdeUrl
    )
  ) {
    setFiltroEstado(
      estadoDesdeUrl
    );
  }

}, [estadoDesdeUrl]);

  return (

    <div>

      {/* ENCABEZADO */}

      <div className="page-header">

        <div>

          <h1>
            Productos
          </h1>

          <p>
            Gestioná el catálogo y el stock de productos
          </p>

        </div>


        <button
          className="btn btn-primary"
          onClick={handleNuevoProducto}
        >
          Nuevo producto
        </button>

      </div>


      {/* ERROR GENERAL */}

      {error && !mostrarFormulario && (

        <div className="error-message">
          {error}
        </div>

      )}


      {/* FILTROS */}

      <div className="filters-bar">

        <input
          type="text"
          placeholder="Buscar por nombre o descripción..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(e.target.value)
          }
        />


        <select
  value={filtroEstado}
  onChange={(e) =>
    setFiltroEstado(e.target.value)
  }
>
  <option value="">
    Todos los productos
  </option>

  <option value="disponible">
    Disponibles
  </option>

  <option value="activo">
    Activos
  </option>

  <option value="inactivo">
    Inactivos
  </option>

  <option value="stock-bajo">
    Stock bajo
  </option>

  <option value="sin-stock">
    Sin stock
  </option>
</select>

      </div>


      {/* TABLA */}

      <div className="table-card">

        <table className="data-table">

          <thead>

            <tr>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>

          </thead>


          <tbody>

            {cargando ? (

              <tr>

                <td colSpan={6}>
                  Cargando productos...
                </td>

              </tr>

            ) : productosFiltrados.length === 0 ? (

              <tr>

                <td colSpan={6}>
                  No se encontraron productos.
                </td>

              </tr>

            ) : (

              productosFiltrados.map(
                (producto) => {

                  const estadoStock =
                    obtenerEstadoStock(
                      producto.stock
                    );

                  return (

                    <tr key={producto.id}>

                      <td>
                        {producto.nombre}
                      </td>


                      <td>

                        {producto.descripcion || "-"}

                      </td>


                      <td>

                        {producto.precio.toLocaleString(
                          "es-AR",
                          {
                            style: "currency",
                            currency: "ARS"
                          }
                        )}

                      </td>


                      <td>

                        <div className="stock-info">

                          <strong>
                            {producto.stock}
                          </strong>

                          <span
                            className={
                              estadoStock.clase
                            }
                          >
                            {estadoStock.texto}
                          </span>

                        </div>

                      </td>


                      <td>

                        <span
                          className={
                            producto.activo
                              ? "status status-active"
                              : "status status-inactive"
                          }
                        >

                          {producto.activo
                            ? "Activo"
                            : "Inactivo"}

                        </span>

                      </td>


                      <td>

                        <div className="table-actions">

                          <button
                            className="btn btn-edit"
                            onClick={() =>
                              handleEditar(
                                producto
                              )
                            }
                          >
                            Editar
                          </button>


                          <button
  className="btn btn-danger"
  onClick={() =>
    setProductoAEliminar(producto)
  }
>
  Eliminar
</button>

                        </div>

                      </td>

                    </tr>

                  );
                }
              )

            )}

          </tbody>

        </table>

      </div>


      {/* MODAL */}

      {mostrarFormulario && (

        <div className="modal-overlay">

          <div className="modal">

            <form
              className="modal-form"
              onSubmit={handleSubmit}
            >

              <h2>

                {productoEditandoId === null
                  ? "Nuevo producto"
                  : "Editar producto"}

              </h2>


              {/* ERROR DEL FORMULARIO */}

              {error && (

                <div className="error-message">
                  {error}
                </div>

              )}


              {/* NOMBRE */}

              <div className="form-group">

                <label htmlFor="producto-nombre">
                  Nombre
                </label>

                <input
                  id="producto-nombre"
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Ej: Teclado mecánico"
                  value={nuevoProducto.nombre}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      nombre: e.target.value
                    })
                  }
                />

              </div>


              {/* DESCRIPCIÓN */}

              <div className="form-group">

                <label htmlFor="producto-descripcion">
                  Descripción
                </label>

                <input
                  id="producto-descripcion"
                  type="text"
                  placeholder="Descripción del producto"
                  value={
                    nuevoProducto.descripcion ?? ""
                  }
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      descripcion:
                        e.target.value
                    })
                  }
                />

              </div>


              {/* PRECIO */}

              <div className="form-group">

                <label htmlFor="producto-precio">
                  Precio
                </label>

                <input
                  id="producto-precio"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={nuevoProducto.precio}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      precio:
                        Number(
                          e.target.value
                        )
                    })
                  }
                />

              </div>


              {/* STOCK */}

              <div className="form-group">

                <label htmlFor="producto-stock">
                  Stock
                </label>

                <input
                  id="producto-stock"
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={nuevoProducto.stock}
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      stock:
                        Number(
                          e.target.value
                        )
                    })
                  }
                />

              </div>


              {/* ESTADO */}

              <div className="form-group">

                <label htmlFor="producto-activo">
                  Estado
                </label>

                <select
                  id="producto-activo"
                  value={
                    nuevoProducto.activo
                      ? "true"
                      : "false"
                  }
                  onChange={(e) =>
                    setNuevoProducto({
                      ...nuevoProducto,
                      activo:
                        e.target.value ===
                        "true"
                    })
                  }
                >

                  <option value="true">
                    Activo
                  </option>

                  <option value="false">
                    Inactivo
                  </option>

                </select>

              </div>


              {/* BOTONES */}

              <div className="modal-actions">

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={guardando}
                >

                  {guardando
                    ? productoEditandoId === null
                      ? "Guardando..."
                      : "Actualizando..."
                    : productoEditandoId === null
                      ? "Guardar"
                      : "Actualizar"}

                </button>


                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={guardando}
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>

              </div>

            </form>

          </div>

        </div>

      )}
{productoAEliminar && (
  <ConfirmModal
    titulo="Eliminar producto"
    mensaje={`¿Estás seguro de que querés eliminar "${productoAEliminar.nombre}"?`}
    textoConfirmar="Eliminar"
    procesando={eliminando}
    onConfirmar={handleEliminar}
    onCancelar={() =>
      setProductoAEliminar(null)
    }
  />
)}
    </div>

  );
}

export default Productos;