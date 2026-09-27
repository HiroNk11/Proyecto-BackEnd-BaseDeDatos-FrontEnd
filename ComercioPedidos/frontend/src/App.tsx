import './App.css'
import { useEffect, useState } from "react"; // importa los hooks useEffect y useState desde React
import {
  obtenerProductos,
  crearProducto,
  eliminarProducto,
  actualizarProducto
} from "./services/productoService"; // importa la función obtenerProductos desde el archivo services/productoService.ts
import type { Producto, CrearProducto} from "./models/Producto"; // importa las interfaces Producto y CrearProducto desde el archivo models/Producto.ts
import type { Cliente, CrearCliente } from "./models/Cliente";
import {
  obtenerClientes,
  crearCliente,
  eliminarCliente,
  actualizarCliente
} from "./services/clienteService";



function App() { // define un componente funcional llamado App
  const [productos, setProductos] = useState<Producto[]>([]); // define un estado llamado productos que es un arreglo de objetos Producto, y una función setProductos para actualizar ese estado
  const [mostrarFormulario, setMostrarFormulario] = useState(false); // define un estado llamado mostrarFormulario que es un booleano, y una función setMostrarFormulario para actualizar ese estado
  const [nuevoProducto, setNuevoProducto] = useState<CrearProducto>({ // define un estado llamado nuevoProducto que es un objeto de tipo CrearProducto, y una función setNuevoProducto para actualizar ese estado
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    activo: true
  }); 

  const [productoEditandoId, setProductoEditandoId] = useState<number | null>(null);

const [clientes, setClientes] = useState<Cliente[]>([]);
  const [mostrarFormularioCliente, setMostrarFormularioCliente] = useState(false);
  const [clienteEditandoId, setClienteEditandoId] = useState<number | null>(null);

  const [nuevoCliente, setNuevoCliente] = useState<CrearCliente>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    activo: true
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  const cargarClientes = async () => {
    try {
      const clientesData = await obtenerClientes();
      setClientes(clientesData);
    } catch (error) {
      console.error("Error al obtener los clientes:", error);
    }
  };

  const handleNuevoCliente = () => {
    setNuevoCliente({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      direccion: "",
      activo: true
    });
    setClienteEditandoId(null);
    setMostrarFormularioCliente(true);
  };

  const handleEditarCliente = (cliente: Cliente) => {
    setNuevoCliente({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono ?? "",
      direccion: cliente.direccion ?? "",
      activo: cliente.activo
    });
    setClienteEditandoId(cliente.id);
    setMostrarFormularioCliente(true);
  };

  const handleSubmitCliente = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (clienteEditandoId === null) {
        await crearCliente(nuevoCliente);
      } else {
        await actualizarCliente(clienteEditandoId, nuevoCliente);
      }
      await cargarClientes();
      setNuevoCliente({
        nombre: "",
        apellido: "",
        email: "",
        telefono: "",
        direccion: "",
        activo: true
      });
      setClienteEditandoId(null);
      setMostrarFormularioCliente(false);
    } catch (error) {
      console.error("Error al guardar el cliente:", error);
    }
  };

  const handleEliminarCliente = async (id: number) => {
    const confirmar = window.confirm("¿Estás seguro de que querés eliminar este cliente?");
    if (!confirmar) {
      return;
    }

    try {
      await eliminarCliente(id);
      await cargarClientes();
    } catch (error) {
      console.error("Error al eliminar el cliente:", error);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarClientes();
  }, []);

  return (
    <div className="App">
      <h1>Lista de Productos</h1>
      <table>
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
          {productos.map((producto) => (
            <tr key={producto.id}>
              <td>{producto.nombre}</td>
              <td>{producto.descripcion}</td>
              <td>${producto.precio}</td>
              <td>{producto.stock}</td>
              <td>{producto.activo ? "Activo" : "Inactivo"}</td>
              <td>
                <button onClick={() => handleEliminar(producto.id)}>Eliminar</button>
                <button onClick={() => handleEditar(producto)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleNuevoProducto}>Nuevo producto</button>

      {mostrarFormulario && (
        <form onSubmit={handleSubmit}>
          <h2>{productoEditandoId === null ? "Nuevo producto" : "Editar producto"}</h2>
          <input
            type="text"
            placeholder="Nombre"
            value={nuevoProducto.nombre}
            onChange={(e) =>
              setNuevoProducto({
                ...nuevoProducto,
                nombre: e.target.value
              })
            }
          />
          <input
            type="text"
            placeholder="Descripción"
            value={nuevoProducto.descripcion}
            onChange={(e) =>
              setNuevoProducto({
                ...nuevoProducto,
                descripcion: e.target.value
              })
            }
          />
          <input
            type="number"
            placeholder="Precio"
            value={nuevoProducto.precio}
            onChange={(e) =>
              setNuevoProducto({
                ...nuevoProducto,
                precio: Number(e.target.value)
              })
            }
          />
          <input
            type="number"
            placeholder="Stock"
            value={nuevoProducto.stock}
            onChange={(e) =>
              setNuevoProducto({
                ...nuevoProducto,
                stock: Number(e.target.value)
              })
            }
          />
          <button type="submit">{productoEditandoId === null ? "Guardar" : "Actualizar"}</button>
          <button
            type="button"
            onClick={() => {
              setMostrarFormulario(false);
              setProductoEditandoId(null);
            }}
          >
            Cancelar
          </button>
        </form>
      )}

      <h1>Lista de Clientes</h1>
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clientes.map((cliente) => (
            <tr key={cliente.id}>
              <td>{cliente.nombre}</td>
              <td>{cliente.apellido}</td>
              <td>{cliente.email}</td>
              <td>{cliente.telefono}</td>
              <td>{cliente.direccion}</td>
              <td>{cliente.activo ? "Activo" : "Inactivo"}</td>
              <td>
                <button onClick={() => handleEliminarCliente(cliente.id)}>Eliminar</button>
                <button onClick={() => handleEditarCliente(cliente)}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleNuevoCliente}>Nuevo cliente</button>

      {mostrarFormularioCliente && (
        <form onSubmit={handleSubmitCliente}>
          <h2>{clienteEditandoId === null ? "Nuevo cliente" : "Editar cliente"}</h2>
          <input
            type="text"
            placeholder="Nombre"
            value={nuevoCliente.nombre}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                nombre: e.target.value
              })
            }
          />
          <input
            type="text"
            placeholder="Apellido"
            value={nuevoCliente.apellido}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                apellido: e.target.value
              })
            }
          />
          <input
            type="text"
            placeholder="Email"
            value={nuevoCliente.email}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                email: e.target.value
              })
            }
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={nuevoCliente.telefono}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                telefono: e.target.value
              })
            }
          />
          <input
            type="text"
            placeholder="Dirección"
            value={nuevoCliente.direccion}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                direccion: e.target.value
              })
            }
          />
          <button type="submit">{clienteEditandoId === null ? "Guardar" : "Actualizar"}</button>
          <button
            type="button"
            onClick={() => {
              setMostrarFormularioCliente(false);
              setClienteEditandoId(null);
            }}
          >
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}

export default App;