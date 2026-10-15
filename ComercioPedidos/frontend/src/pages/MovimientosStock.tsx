    import { useEffect, useState } from "react";
    import Toast from "../components/ui/Toast";
    import type { MovimientoStock } from "../models/MovimientoStock";
    import type { Producto } from "../models/Producto";

    import {
    obtenerMovimientosStock,
    registrarEntradaStock,
    registrarSalidaStock
    } from "../services/movimientoStockService";

    import {
    obtenerProductos
    } from "../services/productoService";

    function MovimientosStock() {



     const [mensajeExito, setMensajeExito] =
    useState("");

    type TipoMovimientoManual =
    "Entrada" | "Salida";

    const [
    tipoMovimientoManual,
    setTipoMovimientoManual
    ] = useState<TipoMovimientoManual | null>(
    null
    );

    const [
    productoMovimientoId,
    setProductoMovimientoId
    ] = useState("");

    const [
    cantidadMovimiento,
    setCantidadMovimiento
    ] = useState("");

    const [
    motivoMovimiento,
    setMotivoMovimiento
    ] = useState("");

    const [
    guardandoMovimiento,
    setGuardandoMovimiento
    ] = useState(false);

    const [
    errorMovimiento,
    setErrorMovimiento
    ] = useState("");

    const [movimientos, setMovimientos] =
        useState<MovimientoStock[]>([]);

    const [productos, setProductos] =
        useState<Producto[]>([]);

    const [pagina, setPagina] =
        useState(1);

    const [totalPaginas, setTotalPaginas] =
        useState(1);

    const [totalRegistros, setTotalRegistros] =
        useState(0);

    const [productoId, setProductoId] =
        useState("");

    const [tipo, setTipo] =
        useState("");

    const [fechaDesde, setFechaDesde] =
        useState("");

    const [fechaHasta, setFechaHasta] =
        useState("");

    const [cargando, setCargando] =
        useState(true);

    const [error, setError] =
        useState("");
    const cerrarModalMovimiento = () => {
    setTipoMovimientoManual(null);
    setProductoMovimientoId("");
    setCantidadMovimiento("");
    setMotivoMovimiento("");
    setErrorMovimiento("");
    };

    const abrirModalMovimiento = (
    tipo: TipoMovimientoManual
    ) => {
    setErrorMovimiento("");
    setTipoMovimientoManual(tipo);
    };
    const [
        filtrosAplicados,
        setFiltrosAplicados
    ] = useState({
        productoId: "",
        tipo: "",
        fechaDesde: "",
        fechaHasta: ""
    });
    const handleRegistrarMovimiento =
    async () => {

        setErrorMovimiento("");

        if (!productoMovimientoId) {
        setErrorMovimiento(
            "Seleccioná un producto."
        );

        return;
        }

        const cantidad =
        Number(cantidadMovimiento);

        if (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
        ) {
        setErrorMovimiento(
            "La cantidad debe ser un número entero mayor que cero."
        );

        return;
        }

        if (!tipoMovimientoManual) {
        return;
        }

        try {
        setGuardandoMovimiento(true);

        const datos = {
            productoId:
            Number(productoMovimientoId),

            cantidad,

            motivo:
            motivoMovimiento.trim() ||
            (
                tipoMovimientoManual ===
                "Entrada"
                ? "Reposición manual"
                : "Salida manual"
            )
        };

        if (
            tipoMovimientoManual ===
            "Entrada"
        ) {
            await registrarEntradaStock(
            datos
            );
        } else {
            await registrarSalidaStock(
            datos
            );
        }

        setMensajeExito(
            tipoMovimientoManual === "Entrada"
            ? "Entrada de stock registrada correctamente."
            : "Salida de stock registrada correctamente."
        );

        cerrarModalMovimiento();

        await cargarProductos();

        if (pagina === 1) {
            await cargarMovimientos();
        } else {
            setPagina(1);
        }

        } catch (error) {

        console.error(
            "Error al registrar movimiento:",
            error
        );

        setErrorMovimiento(
            "No se pudo registrar el movimiento de stock."
        );

        } finally {

        setGuardandoMovimiento(false);
        }
    };
    const cargarProductos = async () => {
        try {
        const data =
            await obtenerProductos();

        setProductos(data);
        } catch (error) {
        console.error(
            "Error al obtener productos:",
            error
        );
        }
    };

    const cargarMovimientos = async () => {
        try {
        setCargando(true);
        setError("");

        const resultado =
            await obtenerMovimientosStock({
            pagina,
            tamanioPagina: 10,

            productoId:
                filtrosAplicados.productoId
                ? Number(
                    filtrosAplicados.productoId
                    )
                : undefined,

            tipo:
                filtrosAplicados.tipo ||
                undefined,

            fechaDesde:
                filtrosAplicados.fechaDesde ||
                undefined,

            fechaHasta:
                filtrosAplicados.fechaHasta ||
                undefined
            });

        setMovimientos(
            resultado.items
        );

        setTotalPaginas(
            resultado.totalPaginas
        );

        setTotalRegistros(
            resultado.totalRegistros
        );

        } catch (error) {

        console.error(
            "Error al obtener movimientos:",
            error
        );

        setError(
            "No se pudieron cargar los movimientos de stock."
        );

        setMovimientos([]);

        } finally {

        setCargando(false);
        }
    };

    const handleAplicarFiltros = () => {
        setPagina(1);

        setFiltrosAplicados({
        productoId,
        tipo,
        fechaDesde,
        fechaHasta
        });
    };

    const handleLimpiarFiltros = () => {
        setProductoId("");
        setTipo("");
        setFechaDesde("");
        setFechaHasta("");

        setPagina(1);

        setFiltrosAplicados({
        productoId: "",
        tipo: "",
        fechaDesde: "",
        fechaHasta: ""
        });
    };

    const hayFiltrosAplicados =
        filtrosAplicados.productoId !== "" ||
        filtrosAplicados.tipo !== "" ||
        filtrosAplicados.fechaDesde !== "" ||
        filtrosAplicados.fechaHasta !== "";

    useEffect(() => {
        cargarProductos();
    }, []);

    useEffect(() => {
        cargarMovimientos();
    }, [pagina, filtrosAplicados]);

    return (
        <div>

        <div className="page-header">
    <div>
        <h1>
        Movimientos de stock
        </h1>

        <p>
        Consultá el historial de entradas y salidas de productos
        </p>
    </div>

    <div className="page-actions">

    <button
        className="btn btn-primary"
        onClick={() =>
        abrirModalMovimiento("Entrada")
        }
    >
        + Registrar entrada
    </button>

    <button
        className="btn btn-danger"
        onClick={() =>
        abrirModalMovimiento("Salida")
        }
    >
        - Registrar salida
    </button>

    </div>
    </div>

        {error && (
            <div className="error-message">
            {error}
            </div>
        )}

        <div className="filters-card">

            <div className="filters-grid">

            <div className="form-group">
  <label htmlFor="movimiento-producto">
    Producto
  </label>

  <select
    id="movimiento-producto"
    value={productoId}
    onChange={(e) =>
      setProductoId(e.target.value)
    }
  >
    <option value="">
      Todos los productos
    </option>

    {productos.map((producto) => (
      <option
        key={producto.id}
        value={producto.id}
      >
        {producto.nombre}
      </option>
    ))}
  </select>
</div>

            <div className="form-group">
                <label htmlFor="movimiento-tipo">
                Tipo
                </label>

                <select
                id="movimiento-tipo"
                value={tipo}
                onChange={(e) =>
                    setTipo(
                    e.target.value
                    )
                }
                >
                <option value="">
                    Todos
                </option>

                <option value="Entrada">
                    Entrada
                </option>

                <option value="Salida">
                    Salida
                </option>
                </select>
            </div>

            <div className="form-group">
                <label htmlFor="movimiento-desde">
                Desde
                </label>

                <input
                id="movimiento-desde"
                type="date"
                value={fechaDesde}
                onChange={(e) =>
                    setFechaDesde(
                    e.target.value
                    )
                }
                />
            </div>

            <div className="form-group">
                <label htmlFor="movimiento-hasta">
                Hasta
                </label>

                <input
                id="movimiento-hasta"
                type="date"
                value={fechaHasta}
                onChange={(e) =>
                    setFechaHasta(
                    e.target.value
                    )
                }
                />
            </div>

            </div>

            <div className="filters-actions">

            <button
                className="btn btn-primary"
                onClick={
                handleAplicarFiltros
                }
            >
                Aplicar filtros
            </button>

            <button
                className="btn btn-secondary"
                onClick={
                handleLimpiarFiltros
                }
            >
                Limpiar
            </button>

            </div>

        </div>

        <div className="table-card">

            <table className="data-table">

            <thead>
                <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Cantidad</th>
                <th>Stock anterior</th>
                <th>Stock posterior</th>
                <th>Motivo</th>
                <th>Pedido</th>
                </tr>
            </thead>

            <tbody>

                {cargando ? (

                <tr>
                    <td colSpan={8}>
                    Cargando movimientos...
                    </td>
                </tr>

                ) : movimientos.length === 0 ? (

                <tr>
                    <td colSpan={8}>
                    {hayFiltrosAplicados
                        ? "No se encontraron movimientos con los filtros seleccionados."
                        : "No hay movimientos de stock registrados."}
                    </td>
                </tr>

                ) : (

                movimientos.map(
                    (movimiento) => (

                    <tr key={movimiento.id}>

                        <td>
                        {new Date(
                            movimiento.fecha
                        ).toLocaleString(
                            "es-AR"
                        )}
                        </td>

                        <td>
                        {movimiento.nombreProducto}
                        </td>

                        <td>
                        <span
                            className={
                            movimiento.tipo === "Entrada"
                                ? "movement-type movement-entry"
                                : "movement-type movement-exit"
                            }
                        >
                            {movimiento.tipo}
                        </span>
                        </td>

                        <td>
                        {movimiento.tipo === "Entrada"
                            ? "+"
                            : "-"}
                        {movimiento.cantidad}
                        </td>

                        <td>
                        {movimiento.stockAnterior}
                        </td>

                        <td>
                        <strong>
                            {movimiento.stockPosterior}
                        </strong>
                        </td>

                        <td>
                        {movimiento.motivo || "-"}
                        </td>

                        <td>
                        {movimiento.pedidoId
                            ? `#${movimiento.pedidoId}`
                            : "-"}
                        </td>

                    </tr>

                    )
                )

                )}

            </tbody>

            </table>

            <div className="pagination">

            <button
                className="btn btn-secondary"
                disabled={
                pagina === 1 ||
                cargando
                }
                onClick={() =>
                setPagina(
                    pagina - 1
                )
                }
            >
                Anterior
            </button>

            <span className="pagination-info">
                Página{" "}
                <strong>
                {pagina}
                </strong>
                {" "}de{" "}
                <strong>
                {totalPaginas}
                </strong>
                {" "}·{" "}
                {totalRegistros} movimientos
            </span>

            <button
                className="btn btn-secondary"
                disabled={
                pagina >= totalPaginas ||
                cargando
                }
                onClick={() =>
                setPagina(
                    pagina + 1
                )
                }
            >
                Siguiente
            </button>

            </div>

        </div>
    {tipoMovimientoManual && (
    <div className="modal-overlay">

        <div className="modal">

        <div className="modal-header">
        <h2>
    Registrar{" "}
    {tipoMovimientoManual.toLowerCase()}{" "}
    de stock
    </h2>

        <button
    type="button"
    className="modal-close"
    disabled={guardandoMovimiento}
    onClick={cerrarModalMovimiento}
    >
    ×
    </button>
        </div>

        <div className="modal-body">

        {errorMovimiento && (
    <div className="error-message">
        {errorMovimiento}
    </div>
    )}

            <div className="form-group">
  <label htmlFor="movimiento-producto-manual">
    Producto
  </label>

  <select
    id="movimiento-producto-manual"
    value={productoMovimientoId}
    disabled={guardandoMovimiento}
    onChange={(e) =>
      setProductoMovimientoId(
        e.target.value
      )
    }
  >
    <option value="">
      Seleccionar producto
    </option>

    {productos.map((producto) => (
      <option
        key={producto.id}
        value={producto.id}
      >
        {producto.nombre}
        {" - Stock actual: "}
        {producto.stock}
      </option>
    ))}
  </select>
</div>

            <div className="form-group">
            <label htmlFor="movimiento-cantidad">
                Cantidad
            </label>

            <input
    id= "movimiento-cantidad"
    type="number"
    min="1"
    step="1"
    value={cantidadMovimiento}
    disabled={guardandoMovimiento}
    onChange={(e) =>
        setCantidadMovimiento(
        e.target.value
        )
    }
    placeholder="Ej: 10"
    />
            </div>

            <div className="form-group">
            <label htmlFor="movimiento-motivo">
                Motivo
            </label>

            <input
    id="movimiento-motivo"
    type="text"
    maxLength={250}
    value={motivoMovimiento}
    disabled={guardandoMovimiento}
    onChange={(e) =>
        setMotivoMovimiento(
        e.target.value
        )
    }
    placeholder={
        tipoMovimientoManual === "Entrada"
        ? "Ej: Compra a proveedor"
        : "Ej: Producto dañado"
    }
    />
            </div>

        </div>

        <div className="modal-actions">

    <button
        className="btn btn-secondary"
        disabled={guardandoMovimiento}
        onClick={cerrarModalMovimiento}
    >
        Cancelar
    </button>

    <button
        className={
        tipoMovimientoManual === "Entrada"
            ? "btn btn-primary"
            : "btn btn-danger"
        }
        disabled={guardandoMovimiento}
        onClick={
        handleRegistrarMovimiento
        }
    >
        {guardandoMovimiento
        ? "Registrando..."
        : tipoMovimientoManual ===
            "Entrada"
            ? "Registrar entrada"
            : "Registrar salida"}
    </button>

    </div>

        </div>

    </div>
    )}

    {mensajeExito && (
    <Toast
        mensaje={mensajeExito}
        tipo="success"
        onCerrar={() =>
        setMensajeExito("")
        }
    />
    )}
        </div>
    );
    }

    export default MovimientosStock;