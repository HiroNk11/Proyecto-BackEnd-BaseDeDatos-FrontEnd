import { useEffect, useState, type FormEvent } from "react";
import type { Producto, CrearProducto } from "../models/Producto";


import {
  obtenerProductos,
  crearProducto,
  eliminarProducto,
  actualizarProducto
} from "../services/productoService";


function Productos() {
  const [productos, setProductos] = useState<Producto[]>([]); // define un estado llamado productos que es un arreglo de objetos Producto, y una función setProductos para actualizar ese estado
  const [mostrarFormulario, setMostrarFormulario] = useState(false); // define un estado llamado mostrarFormulario que es un booleano, y una función setMostrarFormulario para actualizar ese estado
  const [nuevoProducto, setNuevoProducto] = useState<CrearProducto>({ // define un estado llamado nuevoProducto que es un objeto de tipo CrearProducto, y una función setNuevoProducto para actualizar ese estado
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    activo: true
  }); 
const [busqueda, setBusqueda] = useState("");
const [filtroEstado, setFiltroEstado] = useState("");
  const productosFiltrados = productos.filter((producto) => {
  const coincideBusqueda =
    producto.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase()) ||
    (producto.descripcion ?? "")
      .toLowerCase()
      .includes(busqueda.toLowerCase());

  const coincideEstado =
    filtroEstado === "" ||
    (filtroEstado === "activo" && producto.activo) ||
    (filtroEstado === "inactivo" && !producto.activo) ||
    (filtroEstado === "stock-bajo" &&
      producto.stock > 0 &&
      producto.stock <= 5) ||
    (filtroEstado === "sin-stock" &&
      producto.stock === 0);

  return coincideBusqueda && coincideEstado;
});
  const [productoEditandoId, setProductoEditandoId] = useState<number | null>(null);
  const cargarProductos = async () => {
    try {
      const productosData = await obtenerProductos();
      setProductos(productosData);
    } catch (error) {
      console.error("Error al obtener los productos:", error);
    }
  };

    const handleNuevoProducto = () => {
      setNuevoProducto({
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        activo: true
      });
      setProductoEditandoId(null);
      setMostrarFormulario(true);
    };
  
    const handleEditar = (producto: Producto) => {
      setNuevoProducto({
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        precio: producto.precio,
        stock: producto.stock,
        activo: producto.activo
      });
  
      setProductoEditandoId(producto.id);
      setMostrarFormulario(true);
    };
  
    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
  
      try {
        if (productoEditandoId === null) {
          await crearProducto(nuevoProducto);
        } else {
          await actualizarProducto(productoEditandoId, nuevoProducto);
        }
        await cargarProductos();
        setNuevoProducto({
          nombre: "",
          descripcion: "",
          precio: 0,
          stock: 0,
          activo: true
        });
  
        setProductoEditandoId(null);
        setMostrarFormulario(false);
      } catch (error) {
        console.error("Error al guardar el producto:", error);
      }
    };

    const handleEliminar = async (id: number) => {
        const confirmar = window.confirm(
          "¿Estás seguro de que querés eliminar este producto?"
        );
        if (!confirmar) {
          return;
        }
        try {
          await eliminarProducto(id);
          await cargarProductos();
        } catch (error) {
          console.error("Error al eliminar el producto:", error);
        }
      };
const obtenerEstadoStock = (stock: number) => {
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

  useEffect(() => {
  cargarProductos();
}, []);

  return (
  <div>

    <div className="page-header">
      <div>
        <h1>Productos</h1>
        <p>Gestioná el catálogo y el stock de productos</p>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleNuevoProducto}
      >
        Nuevo producto
      </button>
    </div>
<div className="filters-bar">
  <input
    type="text"
    placeholder="Buscar producto..."
    value={busqueda}
    onChange={(e) => setBusqueda(e.target.value)}
  />

  <select
    value={filtroEstado}
    onChange={(e) => setFiltroEstado(e.target.value)}
  >
    <option value="">Todos los productos</option>
    <option value="activo">Activos</option>
    <option value="inactivo">Inactivos</option>
    <option value="stock-bajo">Stock bajo</option>
    <option value="sin-stock">Sin stock</option>
  </select>
</div>
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
          {productosFiltrados.map((producto) => (
            <tr key={producto.id}>
              <td>{producto.nombre}</td>

              <td>
                {producto.descripcion || "-"}
              </td>

              <td>
                {producto.precio.toLocaleString("es-AR", {
  style: "currency",
  currency: "ARS"
})}
              </td>

<td>
  <div className="stock-info">
    <strong>{producto.stock}</strong>

    <span
      className={
        obtenerEstadoStock(producto.stock).clase
      }
    >
      {obtenerEstadoStock(producto.stock).texto}
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
                    onClick={() => handleEditar(producto)}
                  >
                    Editar
                  </button>

                  <button
                    className="btn btn-danger"
                    onClick={() =>
                      handleEliminar(producto.id)
                    }
                  >
                    Eliminar
                  </button>

                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>


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

            <div className="form-group">
  <label htmlFor="producto-nombre">Nombre</label>

  <input
    id="producto-nombre"
    type="text"
    required
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

            <div className="form-group">
  <label htmlFor="producto-descripcion">
    Descripción
  </label>

  <input
    id="producto-descripcion"
    type="text"
    placeholder="Descripción del producto"
    value={nuevoProducto.descripcion ?? ""}
    onChange={(e) =>
      setNuevoProducto({
        ...nuevoProducto,
        descripcion: e.target.value
      })
    }
  />
</div>

           <div className="form-group">
  <label htmlFor="producto-precio">Precio</label>

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
        precio: Number(e.target.value)
      })
    }
  />
</div>

            <div className="form-group">
  <label htmlFor="producto-stock">Stock</label>

  <input
    id="producto-stock"
    type="number"
    required
    min="0"
    value={nuevoProducto.stock}
    onChange={(e) =>
      setNuevoProducto({
        ...nuevoProducto,
        stock: Number(e.target.value)
      })
    }
  />
</div>
<div className="form-group">
  <label htmlFor="producto-activo">
    Estado
  </label>

  <select
    id="producto-activo"
    value={nuevoProducto.activo ? "true" : "false"}
    onChange={(e) =>
      setNuevoProducto({
        ...nuevoProducto,
        activo: e.target.value === "true"
      })
    }
  >
    <option value="true">Activo</option>
    <option value="false">Inactivo</option>
  </select>
</div>
            <div className="modal-actions">

              <button
                className="btn btn-primary"
                type="submit"
              >
                {productoEditandoId === null
                  ? "Guardar"
                  : "Actualizar"}
              </button>

              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
  setMostrarFormulario(false);
  setProductoEditandoId(null);

  setNuevoProducto({
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    activo: true
  });
}}
              >
                Cancelar
              </button>

            </div>

          </form>

        </div>

      </div>
    )}

  </div>
);

}

export default Productos;