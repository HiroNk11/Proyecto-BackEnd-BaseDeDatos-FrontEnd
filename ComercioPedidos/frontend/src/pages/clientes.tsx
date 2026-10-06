
import { useEffect, useState, type FormEvent } from "react";
import type { Cliente, CrearCliente } from "../models/Cliente";
import {
  obtenerClientes,
  crearCliente,
  eliminarCliente,
  actualizarCliente
} from "../services/clienteService";



function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  const [mostrarFormularioCliente, setMostrarFormularioCliente] = useState(false);

  const [clienteEditandoId, setClienteEditandoId] =
    useState<number | null>(null);

  const [nuevoCliente, setNuevoCliente] = useState<CrearCliente>({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
    activo: true
  });

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

  const handleSubmitCliente = async (e: FormEvent) => {
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
    const confirmar = window.confirm(
      "¿Estás seguro de que querés eliminar este cliente?"
    );

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
    cargarClientes();
  }, []);

   return (
  <div>

    <div className="page-header">
      <div>
        <h1>Clientes</h1>
        <p>Gestioná los clientes registrados</p>
      </div>

      <button
        className="btn btn-primary"
        onClick={handleNuevoCliente}
      >
        Nuevo cliente
      </button>
    </div>

    <div className="table-card">
      <table className="data-table">
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
             <td>{cliente.telefono || "-"}</td>
              <td>{cliente.direccion || "-"}</td>
              <td>
  <span
    className={
      cliente.activo
        ? "status status-active"
        : "status status-inactive"
    }
  >
    {cliente.activo ? "Activo" : "Inactivo"}
  </span>
</td>

           <td>
  <div className="table-actions">
    <button
      className="btn btn-edit"
      onClick={() => handleEditarCliente(cliente)}
    >
      Editar
    </button>

    <button
      className="btn btn-danger"
      onClick={() => handleEliminarCliente(cliente.id)}
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

   {mostrarFormularioCliente && (
   <div className="modal-overlay">
    <div className="modal">
      <form
        className="modal-form"
        onSubmit={handleSubmitCliente}
      >
        <h2>
          {clienteEditandoId === null
            ? "Nuevo cliente"
            : "Editar cliente"}
        </h2>
        <div className="form-group">
          <label htmlFor="nombre">Nombre</label>
          <input
            type="text"
            id="nombre"
            required
            placeholder="Nombre"
            value={nuevoCliente.nombre}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                nombre: e.target.value
              })
            }
          />
        </div>
<div className="form-group">
          <label htmlFor="apellido">Apellido</label>
          <input
            type="text"
            id="apellido"
            required
            placeholder="Apellido"
            value={nuevoCliente.apellido}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                apellido: e.target.value
              })
            }
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            required
            placeholder="Email"
            value={nuevoCliente.email}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                email: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="telefono">Teléfono</label>
          <input
            type="tel"
            id="telefono"
            placeholder="Teléfono"
            value={nuevoCliente.telefono ?? ""}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                telefono: e.target.value
              })
            }
          />
        </div>

        <div className="form-group">
          <label htmlFor="direccion">Dirección</label>
          <input
            type="text"
            id="direccion"
            placeholder="Dirección"
            value={nuevoCliente.direccion ?? ""}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                direccion: e.target.value
              })
            }
          />
        </div>
<div className="form-group">
  <label htmlFor="activo">
    Estado
  </label>

  <select
    id="activo"
    value={nuevoCliente.activo ? "true" : "false"}
    onChange={(e) =>
      setNuevoCliente({
        ...nuevoCliente,
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
            {clienteEditandoId === null
              ? "Guardar"
              : "Actualizar"}
          </button>

          <button
            className="btn btn-secondary"
            type="button"
           onClick={() => {
  setMostrarFormularioCliente(false);
  setClienteEditandoId(null);

  setNuevoCliente({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    direccion: "",
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





export default Clientes;