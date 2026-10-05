
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
    });setClienteEditandoId(null);
    setMostrarFormularioCliente(true);  };

    
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
}


  useEffect(() => {
    cargarClientes();
  }, []);

    return (
    <div>
    


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
                <button onClick={() => handleEliminarCliente(cliente.id)}>
                  Eliminar
                </button>

                <button onClick={() => handleEditarCliente(cliente)}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={handleNuevoCliente}>
        Nuevo cliente
      </button>

      {mostrarFormularioCliente && (
        <form onSubmit={handleSubmitCliente}>

          <h2>
            {clienteEditandoId === null
              ? "Nuevo cliente"
              : "Editar cliente"}
          </h2>

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
            value={nuevoCliente.telefono ?? ""}
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
            value={nuevoCliente.direccion ?? ""}
            onChange={(e) =>
              setNuevoCliente({
                ...nuevoCliente,
                direccion: e.target.value
              })
            }
          />

          <button type="submit">
            {clienteEditandoId === null
              ? "Guardar"
              : "Actualizar"}
          </button>

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
  

export default Clientes;