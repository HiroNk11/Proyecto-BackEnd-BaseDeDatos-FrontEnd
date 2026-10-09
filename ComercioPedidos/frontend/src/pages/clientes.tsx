import {
  useEffect,
  useState,
  type FormEvent
} from "react";

import type {
  Cliente,
  CrearCliente
} from "../models/Cliente";

import {
  obtenerClientes,
  crearCliente,
  eliminarCliente,
  actualizarCliente
} from "../services/clienteService";

import { useSearchParams } from "react-router-dom";
import ConfirmModal from "../components/ui/ConfirmModal";

const clienteInicial: CrearCliente = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  direccion: "",
  activo: true
};


function Clientes() {

  /* =========================
     ESTADOS
  ========================= */

  const [
  clienteAEliminar,
  setClienteAEliminar
] = useState<Cliente | null>(null);

const [
  eliminando,
  setEliminando
] = useState(false);

  const [searchParams] = useSearchParams();

  const estadoDesdeUrl =
  searchParams.get("estado") ?? "";
  const [clientes, setClientes] =
    useState<Cliente[]>([]);

  const [
    mostrarFormularioCliente,
    setMostrarFormularioCliente
  ] = useState(false);

  const [
    clienteEditandoId,
    setClienteEditandoId
  ] = useState<number | null>(null);

  const [
    nuevoCliente,
    setNuevoCliente
  ] = useState<CrearCliente>(
    clienteInicial
  );

  const [busqueda, setBusqueda] =
    useState("");

  const [
    filtroEstado,
    setFiltroEstado
  ] = useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");


  /* =========================
     CARGAR CLIENTES
  ========================= */

  const cargarClientes = async () => {

    try {

      setCargando(true);

      const clientesData =
        await obtenerClientes();

      setClientes(clientesData);

   } catch (error) {
  console.error(
    "Error al eliminar el cliente:",
    error
  );

  setClienteAEliminar(null);

  setError(
    "No se pudo eliminar el cliente."
  );
} finally {

      setCargando(false);
    }
  };


  /* =========================
     NUEVO CLIENTE
  ========================= */

  const handleNuevoCliente = () => {

    setNuevoCliente(
      clienteInicial
    );

    setClienteEditandoId(null);

    setError("");

    setMostrarFormularioCliente(
      true
    );
  };


  /* =========================
     EDITAR CLIENTE
  ========================= */

  const handleEditarCliente = (
    cliente: Cliente
  ) => {

    setNuevoCliente({
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono:
        cliente.telefono ?? "",
      direccion:
        cliente.direccion ?? "",
      activo: cliente.activo
    });

    setClienteEditandoId(
      cliente.id
    );

    setError("");

    setMostrarFormularioCliente(
      true
    );
  };


  /* =========================
     CERRAR FORMULARIO
  ========================= */

  const cerrarFormulario = () => {

    setMostrarFormularioCliente(
      false
    );

    setClienteEditandoId(null);

    setNuevoCliente(
      clienteInicial
    );

    setError("");
  };


  /* =========================
     GUARDAR / ACTUALIZAR
  ========================= */

  const handleSubmitCliente = async (
    e: FormEvent
  ) => {

    e.preventDefault();

    try {

      setGuardando(true);

      setError("");


      if (
        clienteEditandoId === null
      ) {

        await crearCliente(
          nuevoCliente
        );

      } else {

        await actualizarCliente(
          clienteEditandoId,
          nuevoCliente
        );
      }


      await cargarClientes();

      cerrarFormulario();

    } catch (error) {

      console.error(
        "Error al guardar el cliente:",
        error
      );

      setError(
        "No se pudo guardar el cliente. Revisá los datos e intentá nuevamente."
      );

    } finally {

      setGuardando(false);
    }
  };


  /* =========================
     ELIMINAR CLIENTE
  ========================= */

  const handleEliminarCliente = async () => {

  if (!clienteAEliminar) {
    return;
  }

  try {

    setEliminando(true);
    setError("");

    await eliminarCliente(
      clienteAEliminar.id
    );

    await cargarClientes();

    setClienteAEliminar(null);

  } catch (error) {

    console.error(
      "Error al eliminar el cliente:",
      error
    );

    setError(
      "No se pudo eliminar el cliente."
    );

  } finally {

    setEliminando(false);
  }
};


  /* =========================
     FILTROS
  ========================= */

  const clientesFiltrados =
    clientes.filter(
      (cliente) => {

        const textoBusqueda =
          busqueda
            .trim()
            .toLowerCase();


        const coincideBusqueda =
          cliente.nombre
            .toLowerCase()
            .includes(
              textoBusqueda
            ) ||

          cliente.apellido
            .toLowerCase()
            .includes(
              textoBusqueda
            ) ||

          cliente.email
            .toLowerCase()
            .includes(
              textoBusqueda
            );


        const coincideEstado =
          filtroEstado === "" ||

          (
            filtroEstado ===
              "activo" &&
            cliente.activo
          ) ||

          (
            filtroEstado ===
              "inactivo" &&
            !cliente.activo
          );


        return (
          coincideBusqueda &&
          coincideEstado
        );
      }
    );


  /* =========================
     CARGA INICIAL
  ========================= */

  useEffect(() => {

    cargarClientes();

  }, []);
  
  useEffect(() => {

  const estadosPermitidos = [
    "activo",
    "inactivo"
  ];

  if (
    estadosPermitidos.includes(
      estadoDesdeUrl
    )
  ) {
    setFiltroEstado(
      estadoDesdeUrl
    );
  } else {
    setFiltroEstado("");
  }

}, [estadoDesdeUrl]);

  /* =========================
     JSX
  ========================= */

  return (

    <div>

      {/* ENCABEZADO */}

      <div className="page-header">

        <div>

          <h1>
            Clientes
          </h1>

          <p>
            Gestioná los clientes registrados
          </p>

        </div>


        <button
          className="btn btn-primary"
          onClick={
            handleNuevoCliente
          }
        >
          Nuevo cliente
        </button>

      </div>


      {/* ERROR GENERAL */}

      {error &&
        !mostrarFormularioCliente && (

        <div className="error-message">
          {error}
        </div>

      )}


      {/* BÚSQUEDA Y FILTROS */}

      <div className="filters-bar">

        <input
          type="text"
          placeholder="Buscar por nombre, apellido o email..."
          value={busqueda}
          onChange={(e) =>
            setBusqueda(
              e.target.value
            )
          }
        />


        <select
          value={filtroEstado}
          onChange={(e) =>
            setFiltroEstado(
              e.target.value
            )
          }
        >

          <option value="">
            Todos los clientes
          </option>

          <option value="activo">
            Activos
          </option>

          <option value="inactivo">
            Inactivos
          </option>

        </select>

      </div>


      {/* TABLA */}

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

            {cargando ? (

              <tr>

                <td colSpan={7}>
                  Cargando clientes...
                </td>

              </tr>

            ) : clientesFiltrados.length ===
              0 ? (

              <tr>

                <td colSpan={7}>
                  No se encontraron clientes.
                </td>

              </tr>

            ) : (

              clientesFiltrados.map(
                (cliente) => (

                  <tr key={cliente.id}>

                    <td>
                      {cliente.nombre}
                    </td>


                    <td>
                      {cliente.apellido}
                    </td>


                    <td>
                      {cliente.email}
                    </td>


                    <td>
                      {cliente.telefono ||
                        "-"}
                    </td>


                    <td>
                      {cliente.direccion ||
                        "-"}
                    </td>


                    <td>

                      <span
                        className={
                          cliente.activo
                            ? "status status-active"
                            : "status status-inactive"
                        }
                      >

                        {cliente.activo
                          ? "Activo"
                          : "Inactivo"}

                      </span>

                    </td>


                    <td>

                      <div className="table-actions">

                        <button
                          className="btn btn-edit"
                          onClick={() =>
                            handleEditarCliente(
                              cliente
                            )
                          }
                        >
                          Editar
                        </button>


                        <button
                        className="btn btn-danger"
                        onClick={() =>
                          setClienteAEliminar(cliente)
                          }
                          >
                          Eliminar
                            </button>

                      </div>

                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>


      {/* MODAL CLIENTE */}

      {mostrarFormularioCliente && (

        <div className="modal-overlay">

          <div className="modal">

            <form
              className="modal-form"
              onSubmit={
                handleSubmitCliente
              }
            >

              <h2>

                {clienteEditandoId ===
                null
                  ? "Nuevo cliente"
                  : "Editar cliente"}

              </h2>


              {/* ERROR DEL FORMULARIO */}

              {error && (

                <div className="error-message">
                  {error}
                </div>

              )}


              {/* NOMBRE */}

              <div className="form-group">

                <label htmlFor="cliente-nombre">
                  Nombre
                </label>


                <input
                  id="cliente-nombre"
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Ej: Juan"
                  value={
                    nuevoCliente.nombre
                  }
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      nombre:
                        e.target.value
                    })
                  }
                />

              </div>


              {/* APELLIDO */}

              <div className="form-group">

                <label htmlFor="cliente-apellido">
                  Apellido
                </label>


                <input
                  id="cliente-apellido"
                  type="text"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Ej: Pérez"
                  value={
                    nuevoCliente.apellido
                  }
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      apellido:
                        e.target.value
                    })
                  }
                />

              </div>


              {/* EMAIL */}

              <div className="form-group">

                <label htmlFor="cliente-email">
                  Email
                </label>


                <input
                  id="cliente-email"
                  type="email"
                  required
                  maxLength={150}
                  placeholder="juan@email.com"
                  value={
                    nuevoCliente.email
                  }
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      email:
                        e.target.value
                    })
                  }
                />

              </div>


              {/* TELÉFONO */}

              <div className="form-group">

                <label htmlFor="cliente-telefono">
                  Teléfono
                </label>


                <input
                  id="cliente-telefono"
                  type="tel"
                  placeholder="Ej: 11 1234-5678"
                  value={
                    nuevoCliente.telefono ??
                    ""
                  }
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      telefono:
                        e.target.value
                    })
                  }
                />

              </div>


              {/* DIRECCIÓN */}

              <div className="form-group">

                <label htmlFor="cliente-direccion">
                  Dirección
                </label>


                <input
                  id="cliente-direccion"
                  type="text"
                  maxLength={250}
                  placeholder="Ej: Av. Corrientes 1234"
                  value={
                    nuevoCliente.direccion ??
                    ""
                  }
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,
                      direccion:
                        e.target.value
                    })
                  }
                />

              </div>


              {/* ESTADO */}

              <div className="form-group">

                <label htmlFor="cliente-activo">
                  Estado
                </label>


                <select
                  id="cliente-activo"
                  value={
                    nuevoCliente.activo
                      ? "true"
                      : "false"
                  }
                  onChange={(e) =>
                    setNuevoCliente({
                      ...nuevoCliente,

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


              {/* ACCIONES */}

              <div className="modal-actions">

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={guardando}
                >

                  {guardando
                    ? clienteEditandoId ===
                      null
                      ? "Guardando..."
                      : "Actualizando..."
                    : clienteEditandoId ===
                        null
                      ? "Guardar"
                      : "Actualizar"}

                </button>


                <button
                  className="btn btn-secondary"
                  type="button"
                  disabled={guardando}
                  onClick={
                    cerrarFormulario
                  }
                >
                  Cancelar
                </button>

              </div>

            </form>

          </div>

        </div>

      )}
{clienteAEliminar && (
  <ConfirmModal
    titulo="Eliminar cliente"
    mensaje={`¿Estás seguro de que querés eliminar a ${clienteAEliminar.nombre} ${clienteAEliminar.apellido}?`}
    textoConfirmar="Eliminar"
    procesando={eliminando}
    onConfirmar={handleEliminarCliente}
    onCancelar={() =>
      setClienteAEliminar(null)
    }
  />
)}
    </div>

  );
  
}


export default Clientes;